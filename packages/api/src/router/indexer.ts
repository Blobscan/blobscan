import { z } from "zod";

import { createTRPCRouter, jwtAuthedProcedure } from "../trpc";

const INDEXER_ID = 1;

export const indexerRouter = createTRPCRouter({
  getSlot: jwtAuthedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/slot",
        tags: ["indexer"],
        summary: "Get the latest known slot from the database",
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
        method: "POST",
        path: "/slot",
        tags: ["indexer"],
        summary: "Update the latest known slot in the database",
      },
    })
    .input(z.object({ slot: z.number() }))
    .output(z.object({ slot: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const slot = input.slot;

      await ctx.prisma.indexerMetadata.upsert({
        where: { id: INDEXER_ID },
        update: {
          lastSlot: slot,
        },
        create: {
          lastSlot: slot,
        },
      });

      return { slot };
    }),
  addFailedSlots: jwtAuthedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/failed-slots-chunks",
        tags: ["indexer"],
        summary: "Add slots chunks failed to be indexed to the database",
      },
    })
    .input(
      z.object({
        chunks: z.array(
          z.object({
            initialSlot: z.number(),
            finalSlot: z.number(),
          }),
        ),
      }),
    )
    .output(
      z.object({
        count: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chunks = input.chunks;

      return await ctx.prisma.indexerFailedSlotsChunk.createMany({
        data: chunks,
      });
    }),
  index: jwtAuthedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/index",
        tags: ["indexer"],
        summary: "Index data in the database",
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
    .output(z.object({ block: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const createBlock = ctx.prisma.block.create({
        data: {
          id: input.block.number,
          number: input.block.number,
          hash: input.block.hash,
          timestamp: input.block.timestamp,
          slot: input.block.slot,
        },
      });

      const createTransactions = ctx.prisma.transaction.createMany({
        data: input.transactions.map((transaction) => ({
          id: transaction.hash,
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          blockNumber: transaction.blockNumber,
        })),
      });

      const createBlobs = ctx.prisma.blob.createMany({
        data: input.blobs.map((blob) => ({
          versionedHash: blob.versionedHash,
          commitment: blob.commitment,
          data: blob.data,
          txHash: blob.txHash,
          index: blob.index,
        })),
      });

      await ctx.prisma.$transaction([
        createBlock,
        createTransactions,
        createBlobs,
      ]);

      return { block: input.block.number };
    }),
});
