import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  PAGINATION_SCHEMA,
  withPagination,
} from "../middlewares/withPagination";
import { publicProcedure } from "../procedures";
import { fullTransactionSelect } from "../queries/tx";
import { createTRPCRouter } from "../trpc";

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(PAGINATION_SCHEMA)
    .use(withPagination)
    .query(async ({ ctx }) => {
      const [transactions, overallStats] = await Promise.all([
        ctx.prisma.transaction.findMany({
          select: fullTransactionSelect,
          orderBy: { blockNumber: "desc" },
          ...ctx.pagination,
        }),
        ctx.prisma.transactionOverallStats.findFirst({
          select: {
            totalTransactions: true,
          },
        }),
      ]);

      return {
        transactions,
        totalTransactions: overallStats?.totalTransactions ?? 0,
      };
    }),
  getByAddress: publicProcedure
    .input(PAGINATION_SCHEMA)
    .use(withPagination)
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { address } = input;

      const [transactions, totalTransactions] = await Promise.all([
        ctx.prisma.transaction.findMany({
          select: fullTransactionSelect,
          where: {
            OR: [{ fromId: address }, { toId: address }],
          },
          orderBy: { blockNumber: "desc" },
          ...ctx.pagination,
        }),
        ctx.prisma.transaction.count({
          where: {
            OR: [{ fromId: address }, { toId: address }],
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
      })
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
