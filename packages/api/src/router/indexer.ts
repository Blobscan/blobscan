import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type {
  Blob,
  Transaction,
  OmittableFields,
  BlobDataStorageReference,
  Block,
} from "@blobscan/db";

import { jwtAuthedProcedure } from "../middlewares/isJWTAuthed";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { calculateBlobSize } from "../utils/blob";

const INDEXER_PATH = "/indexer";
const INDEX_REQUEST_DATA = z.object({
  block: z.object({
    number: z.coerce.number(),
    hash: z.string(),
    timestamp: z.coerce.number(),
    slot: z.coerce.number(),
  }),
  transactions: z.array(
    z.object({
      hash: z.string(),
      from: z.string(),
      to: z.string().optional(),
      blockNumber: z.coerce.number(),
    })
  ),
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      data: z.string(),
      txHash: z.string(),
      index: z.coerce.number(),
    })
  ),
});

export const indexerRouter = createTRPCRouter({
  getSlot: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${INDEXER_PATH}/slot`,
        tags: ["indexer"],
        summary: "Get the latest processed slot from the database",
      },
    })
    .input(z.void())
    .output(z.object({ slot: z.number() }))
    .query(async ({ ctx }) => {
      const syncState = await ctx.prisma.blockchainSyncState.findUnique({
        where: { id: 1 },
      });

      return { slot: syncState?.lastSlot ?? 0 };
    }),
  updateSlot: jwtAuthedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: `${INDEXER_PATH}/slot`,
        tags: ["indexer"],
        summary: "Update the latest processed slot in the database",
        protect: true,
      },
    })
    .input(z.object({ slot: z.number() }))
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const slot = input.slot;

      await ctx.prisma.blockchainSyncState.upsert({
        where: { id: 1 },
        update: {
          lastSlot: slot,
        },
        create: {
          id: 1,
          lastSlot: slot,
          lastFinalizedBlock: 0,
        },
      });
    }),
  index: jwtAuthedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: `${INDEXER_PATH}/block-txs-blobs`,
        tags: ["indexer"],
        summary: "Index data in the database",
        protect: true,
      },
    })
    .input(INDEX_REQUEST_DATA)
    .output(z.void())
    .mutation(async ({ ctx: { prisma, blobStorageManager }, input }) => {
      const timestamp = new Date(input.block.timestamp * 1000);
      const operations = [];

      // 1. Upload blobs' data to storages

      const newBlobs = await prisma.blob.filterNewBlobs(input.blobs);

      let blobStorageRefs: BlobDataStorageReference[];
      try {
        blobStorageRefs = (
          await Promise.all(
            newBlobs.map(async (b) => {
              const blobDataRefs = await blobStorageManager.storeBlob(b);

              return blobDataRefs.map<BlobDataStorageReference>((ref) => ({
                blobHash: b.versionedHash,
                blobStorage: ref.storage,
                dataReference: ref.reference,
              }));
            })
          )
        ).flat();
      } catch (err_) {
        const err = err_ as Error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload blobs to storages: ${err.message}`,
        });
      }

      // 2. Prepare address, block, transaction and blob insertions

      // TODO: Create an upsert extension that set the `insertedAt` and the `updatedAt` field
      const now = new Date();

      const dbBlock: Omit<Block, OmittableFields> = {
        number: input.block.number,
        hash: input.block.hash,
        timestamp,
        slot: input.block.slot,
      };
      const dbTxs = input.transactions.map<Omit<Transaction, OmittableFields>>(
        (tx) => ({
          blockNumber: tx.blockNumber,
          hash: tx.hash,
          fromId: tx.from,
          toId: tx.to ?? null,
        })
      );
      const dbBlobs = input.blobs.map<Omit<Blob, OmittableFields>>((blob) => ({
        versionedHash: blob.versionedHash,
        commitment: blob.commitment,
        size: calculateBlobSize(blob.data),
        firstBlockNumber: input.block.number,
        gsUri: "",
        swarmHash: null,
      }));
      const dbBlobStorageRefs = blobStorageRefs;

      operations.push(
        prisma.block.upsert({
          where: { hash: input.block.hash },
          create: {
            ...dbBlock,
            insertedAt: now,
            updatedAt: now,
          },
          update: {
            ...dbBlock,
            updatedAt: now,
          },
        })
      );
      operations.push(
        prisma.address.upsertAddressesFromTransactions(input.transactions)
      );
      operations.push(prisma.transaction.upsertMany(dbTxs));
      operations.push(prisma.blob.upsertMany(dbBlobs));
      operations.push(
        prisma.blobDataStorageReference.upsertMany(dbBlobStorageRefs)
      );
      operations.push(
        prisma.blobsOnTransactions.createMany({
          data: input.blobs.map((blob) => ({
            blobHash: blob.versionedHash,
            txHash: blob.txHash,
            index: blob.index,
          })),
          skipDuplicates: true,
        })
      );

      // 3. Execute all database operations in a single transaction
      await prisma.$transaction(operations);
    }),
});
