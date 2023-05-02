import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const indexerRouter = createTRPCRouter({
  getSlot: publicProcedure
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
      const config = await ctx.prisma.config.findUnique({
        where: { id: 1 },
      });

      return { slot: config?.lastSlot ?? 0 };
    }),
  updateSlot: publicProcedure
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

      await ctx.prisma.config.upsert({
        where: { id: 1 },
        update: {
          lastSlot: slot,
        },
        create: {
          lastSlot: slot,
        },
      });

      return { slot };
    }),
  index: publicProcedure
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
            to: z.string(),
            block_number: z.coerce.number(),
          }),
        ),
        blobs: z.array(
          z.object({
            versioned_hash: z.string(),
            commitment: z.string(),
            data: z.string(),
            tx_hash: z.string(),
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
          blockNumber: transaction.block_number,
        })),
      });

      const createBlobs = ctx.prisma.blob.createMany({
        data: input.blobs.map((blob) => ({
          versionedHash: blob.versioned_hash,
          commitment: blob.commitment,
          data: blob.data,
          txHash: blob.tx_hash,
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
