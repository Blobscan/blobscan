import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const indexerRouter = createTRPCRouter({
  slot: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/update/slot",
        tags: ["indexer"],
        summary: "Update the latest known slot in the database",
      },
    })
    .input(z.number())
    .output(z.number())
    .mutation(async ({ ctx, input }) => {
       
      await ctx.prisma.config.upsert({
        where: { id: 1 },
        update: {
          lastSlot: input,
        },
        create: {
          lastSlot: input,
        },
      });

      return input;
    }),
  block: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/index/block",
        tags: ["indexer"],
        summary: "Index a block in the database",
      },
    })
    .input(
      z.object({
        block: z.object({
          id: z.number(),
          number: z.number(),
          hash: z.string(),
          timestamp: z.number(),
          slot: z.number(),
        }),
        transactions: z.array(
          z.object({
            id: z.string(),
            hash: z.string(),
            from: z.string(),
            to: z.string(),
            blockNumber: z.number(),
          }),
        ),
        blobs: z.array(
          z.object({
            versionedHash: z.string(),
            commitment: z.string(),
            data: z.string(),
            txHash: z.string(),
            index: z.number(),
          }),
        ),
      }),
    )
    .output(z.number())
    .mutation(async ({ ctx, input }) => {
      const createBlock = ctx.prisma.block.create({
        data: {
          id: input.block.id,
          number: input.block.number,
          hash: input.block.hash,
          timestamp: input.block.timestamp,
          slot: input.block.slot,
        },
      });

      const createTransactions = ctx.prisma.transaction.createMany({
        data: input.transactions.map((transaction) => ({
          id: transaction.id,
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

      return input.block.id;
    }),
});
