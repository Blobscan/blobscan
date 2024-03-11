import type { Rollup } from "@blobscan/db";

import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullTransaction, fullTransactionSelect } from "./common";
import { getAllInputSchema } from "./getAll.schema";

export const getAllFull = publicProcedure
  .input(getAllInputSchema)
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
          ...ctx.pagination,
        })
        .then((txs) => txs.map(formatFullTransaction)),
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
