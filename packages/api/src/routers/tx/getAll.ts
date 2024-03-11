import type { Rollup } from "@blobscan/db";

import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullTransactionForApi, fullTransactionSelect } from "./common";
import { getAllInputSchema, getAllOutputSchema } from "./getAll.schema";

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions",
      tags: ["transactions"],
      summary: "retrieves all blob transactions.",
    },
  })
  .input(getAllInputSchema)
  .output(getAllOutputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const sourceRollup = input?.rollup?.toUpperCase() as Rollup | undefined;

    const [transactions, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction
        .findMany({
          select: fullTransactionSelect,
          orderBy: {
            block: {
              number: "desc",
            },
          },
          where: {
            sourceRollup,
          },
          ...ctx.pagination,
        })
        .then((txs) => txs.map(formatFullTransactionForApi)),
      sourceRollup
        ? ctx.prisma.transaction.count({
            where: {
              sourceRollup,
            },
          })
        : ctx.prisma.transactionOverallStats.findFirst({
            select: {
              totalTransactions: true,
            },
          }),
    ]);

    return {
      transactions,
      totalTransactions:
        typeof txCountOrStats === "number"
          ? txCountOrStats
          : txCountOrStats?.totalTransactions ?? 0,
    };
  });
