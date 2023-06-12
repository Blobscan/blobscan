import { z } from "zod";

import { createTRPCRouter, jwtAuthedProcedure, publicProcedure } from "../trpc";

const INDEXER_PATH = "/indexer";

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
    .input(
      z.object({
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
      }),
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const timestamp = new Date(input.block.timestamp * 1000);

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
          data: blob.data,
          txHash: blob.txHash,
          index: blob.index,
          timestamp,
        })),
        skipDuplicates: true,
      });

      await ctx.prisma.$transaction([
        createBlock,
        createTransactions,
        createBlobs,
      ]);
    }),
});
