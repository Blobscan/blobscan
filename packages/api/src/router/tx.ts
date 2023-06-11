import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, paginatedProcedure, publicProcedure } from "../trpc";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  id: false,
  hash: true,
  from: true,
  to: true,
  blockNumber: true,
});

export const fullTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    ...transactionSelect,
    block: {
      select: {
        timestamp: true,
      },
    },
    blobs: {
      select: {
        id: false,
        versionedHash: true,
        commitment: true,
        index: true,
      },
    },
  });

export const transactionRouter = createTRPCRouter({
  getAll: paginatedProcedure.query(async ({ ctx }) => {
    const [transactions, totalTransactions] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        orderBy: { blockNumber: "desc" },
        ...ctx.pagination,
      }),
      ctx.prisma.transaction.count(),
    ]);

    return {
      transactions,
      totalTransactions,
    };
  }),
  getByAddress: paginatedProcedure
    .input(
      z.object({
        address: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { address } = input;

      const [transactions, totalTransactions] = await Promise.all([
        ctx.prisma.transaction.findMany({
          select: fullTransactionSelect,
          where: {
            OR: [{ from: address }, { to: address }],
          },
          orderBy: { blockNumber: "desc" },
          ...ctx.pagination,
        }),
        ctx.prisma.transaction.count({
          where: {
            OR: [{ from: address }, { to: address }],
          },
        }),
      ]);

      return {
        transactions,
        totalTransactions,
      };
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

      const { block, ...txBase } = tx;
      return {
        ...txBase,
        timestamp: block.timestamp,
      };
    }),
});
