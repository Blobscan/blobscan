import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { BUCKET_NAME } from "../env";
import { createTRPCRouter, jwtAuthedProcedure, publicProcedure } from "../trpc";
import { buildGoogleStorageUri } from "../utils/storages";

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
        summary: "Get the indexer's latest indexed slot",
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
        summary: "Update the indexer's latest indexed slot",
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
    .mutation(async ({ ctx, input }) => {
      const timestamp = new Date(input.block.timestamp * 1000);
      // Check we have enough swarm postages
      const batches = await ctx.swarm.beeDebug.getAllPostageBatch();
      if (batches.length === 0 || batches[0]?.batchID === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Not available Swarm postages`,
        });
      }

      const blockData = {
        number: input.block.number,
        hash: input.block.hash,
        timestamp,
        slot: input.block.slot,
      };
      const createBlock = ctx.prisma.block.upsert({
        where: { id: input.block.number },
        create: {
          id: input.block.number,
          ...blockData,
        },
        update: blockData,
      });

      const createTransactions = ctx.prisma.transaction.createMany({
        data: input.transactions.map((transaction) => ({
          id: transaction.hash,
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          blockNumber: transaction.blockNumber,
          timestamp,
        })),
        skipDuplicates: true,
      });

      const createBlobs = ctx.prisma.blob.createMany({
        data: input.blobs.map((blob) => ({
          versionedHash: blob.versionedHash,
          commitment: blob.commitment,
          txHash: blob.txHash,
          index: blob.index,
          timestamp,
        })),
        skipDuplicates: true,
      });

      // Check if we already have the blob data in the database
      const existingBlobDataHashes = await ctx.prisma.blobData
        .findMany({
          select: { versionedHash: true },
          where: {
            id: { in: input.blobs.map((blob) => blob.versionedHash) },
          },
        })
        .then((blobDatas) => blobDatas.map((b) => b.versionedHash));
      const newBlobs = input.blobs.filter(
        (b) => !existingBlobDataHashes.includes(b.versionedHash),
      );

      const batchId = batches[0].batchID;
      const uploadBlobsDataPromise = newBlobs.map(async (b) => {
        const uploadBlobsToGoogleStoragePromise = ctx.storage
          .bucket(BUCKET_NAME)
          .file(buildGoogleStorageUri(b.versionedHash))
          .save(b.data);

        const uploadBlobsToSwarmPromise = ctx.swarm.bee.uploadFile(
          batchId,
          b.data,
          buildGoogleStorageUri(b.versionedHash),
          {
            pin: true,
            contentType: "text/plain",
          },
        );

        const [, swarmUploadData] = await Promise.all([
          uploadBlobsToGoogleStoragePromise,
          uploadBlobsToSwarmPromise,
        ]);

        return {
          id: b.versionedHash,
          versionedHash: b.versionedHash,
          gsUri: buildGoogleStorageUri(b.versionedHash),
          swarmHash: swarmUploadData.reference.toString(),
          size: b.data.slice(2).length / 2,
        };
      });
      const blobDatas = await Promise.all(uploadBlobsDataPromise);

      const createBlobDatas = ctx.prisma.blobData.createMany({
        data: blobDatas,
      });

      await ctx.prisma.$transaction([
        createBlock,
        createTransactions,
        createBlobDatas,
        createBlobs,
      ]);
    }),
});
