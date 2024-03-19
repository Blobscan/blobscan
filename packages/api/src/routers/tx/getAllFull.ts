import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { baseGetAllInputSchema } from "../../utils";
import { formatFullTransaction, fullTransactionSelect } from "./common";

export const getAllFull = publicProcedure
  .input(baseGetAllInputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const { sort, endBlock, rollup, startBlock } = input;

    const [transactions, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction
        .findMany({
          select: fullTransactionSelect,
          where: {
            rollup,
            block: {
              number: {
                lt: endBlock,
                gte: startBlock,
              },
            },
          },
          orderBy: {
            block: {
              number: sort,
            },
          },
          ...ctx.pagination,
        })
        .then((txs) => txs.map(formatFullTransaction)),
      rollup
        ? ctx.prisma.transaction.count({
            where: {
              rollup,
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
