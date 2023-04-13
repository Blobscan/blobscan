import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { DEFAULT_LIMIT } from "../constants";
import { createTRPCRouter, publicProcedure } from "../trpc";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  id: false,
  hash: true,
  from: true,
  to: true,
  blockNumber: true,
});

const fullTransactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  ...transactionSelect,
  block: {
    select: {
      timestamp: true,
    },
  },
  blobs: {
    select: {
      hash: true,
    },
  },
});

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      const take = input.limit ?? DEFAULT_LIMIT;

      return ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        orderBy: { blockNumber: "desc" },
        take,
      });
    }),
  getByHash: publicProcedure
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { hash } = input;
      const tx = await ctx.prisma.transaction.findUnique({
        select: fullTransactionSelect,
        where: { hash },
      });
      if (!tx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No tx with hash '${hash}'`,
        });
      }
      return tx;
    }),
});
