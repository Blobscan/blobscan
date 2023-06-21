import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { statsAggregator, type Prisma } from "@blobscan/db";

import { jwtAuthedProcedure } from "../middlewares/isJWTAuthed";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { calculateBlobSize } from "../utils/blob";
import { getNewBlobs, getUniqueAddressesFromTxs } from "../utils/indexer";

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
    }),
  ),
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      data: z.string(),
      txHash: z.string(),
      index: z.coerce.number(),
    }),
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
      const indexerMetadata = await ctx.prisma.indexerMetadata.findUnique({
        where: { id: 1 },
      });

      return { slot: indexerMetadata?.lastSlot ?? 0 };
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

      await ctx.prisma.indexerMetadata.upsert({
        where: { id: 1 },
        update: {
          lastSlot: slot,
        },
        create: {
          id: 1,
          lastSlot: slot,
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

      // 1. Fetch unique addresses from transactions & check for existing blobs

      const [{ uniqueFromAddresses, uniqueToAddresses }, newBlobs] =
        await Promise.all([
          getUniqueAddressesFromTxs(prisma, input.transactions),
          getNewBlobs(prisma, input.blobs),
        ]);

      // 2. Upload blobs' data to storages
      let uploadedBlobs: Prisma.BlobCreateInput[] = [];
      try {
        const uploadBlobsPromises = newBlobs.map<
          Promise<Prisma.BlobCreateInput>
        >(async (b) => {
          const blobReferences = await blobStorageManager.storeBlob(b);

          return {
            id: b.versionedHash,
            versionedHash: b.versionedHash,
            commitment: b.commitment,
            gsUri: blobReferences.google,
            swarmHash: blobReferences.swarm,
            size: calculateBlobSize(b.data),
          };
        });

        uploadedBlobs = await Promise.all(uploadBlobsPromises);
      } catch (err_) {
        const err = err_ as Error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload blobs to storages: ${err.message}`,
        });
      }

      // 3. Prepare block, transaction and blob insertions

      const createBlobsDataPromise = prisma.blob.createMany({
        data: uploadedBlobs,
      });

      const blockData = {
        number: input.block.number,
        hash: input.block.hash,
        timestamp,
        slot: input.block.slot,
      };

      const createBlockPromise = prisma.block.upsert({
        where: { id: input.block.number },
        create: {
          id: input.block.number,
          ...blockData,
        },
        update: blockData,
      });
      const createAddressesPromise = prisma.address.createMany({
        data: [...uniqueFromAddresses.new, ...uniqueToAddresses.new],
      });
      const updateAddressesPromise = prisma.address.updateMany({
        data: [...uniqueFromAddresses.existing, ...uniqueToAddresses.existing],
      });
      const createTransactionsPromises = prisma.transaction.createMany({
        data: input.transactions.map((transaction) => ({
          id: transaction.hash,
          hash: transaction.hash,
          fromId: transaction.from,
          toId: transaction.to,
          blockNumber: transaction.blockNumber,
          timestamp,
        })),
        // TODO: to make the endpoint truly idempotent we should not skip duplicates but update them when re-indexing
        skipDuplicates: true,
      });
      const createBlobsOnTransactionPromise =
        prisma.blobsOnTransactions.createMany({
          data: input.blobs.map((blob) => ({
            blobHash: blob.versionedHash,
            txHash: blob.txHash,
            index: blob.index,
          })),
          skipDuplicates: true,
        });

      // 4. Prepare overall stats incremental updates

      const uploadedBlobsSize = uploadedBlobs.reduce(
        (totalBlobSize, b) => totalBlobSize + b.size,
        0,
      );
      const totalReceivers =
        uniqueToAddresses.existing.length + uniqueToAddresses.new.length;
      const totalSenders =
        uniqueFromAddresses.existing.length + uniqueFromAddresses.new.length;

      const updateBlockOverallStatsPromise =
        statsAggregator.block.upsertOverallBlockStats(1);
      const updateTxOverallStatsPromise =
        statsAggregator.tx.upsertOverallTxStats(
          input.transactions.length,
          totalReceivers,
          totalSenders,
        );
      const updateBlobOverallStatsPromise =
        statsAggregator.blob.upsertOverallBlobStats(
          input.blobs.length,
          uploadedBlobs.length,
          uploadedBlobsSize,
        );

      // 5. Execute all database operations in a single transaction

      await prisma.$transaction([
        createBlockPromise,
        updateAddressesPromise,
        createAddressesPromise,
        createTransactionsPromises,
        createBlobsDataPromise,
        createBlobsOnTransactionPromise,
        updateBlockOverallStatsPromise,
        updateTxOverallStatsPromise,
        updateBlobOverallStatsPromise,
      ]);
    }),
});
