import { z } from "@blobscan/zod";

import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import {
  formatFullTransaction,
  fullTransactionSelect,
  getTransactionOutputSchema,
} from "./common";

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions",
      tags: ["transactions"],
      summary: "get transactions",
    },
  })
  .input(paginationSchema.optional())
  .output(
    z.object({
      transactions: getTransactionOutputSchema.array(),
      totalTransactions: z.number(),
    })
  )
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [transactions, overallStats] = await Promise.all([
      ctx.prisma.transaction
        .findMany({
          select: fullTransactionSelect,
          orderBy: {
            block: {
              number: "desc",
            },
          },
          ...ctx.pagination,
        })
        .then((txs) => txs.map(formatFullTransaction)),
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
  });
