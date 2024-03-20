import { withFilters } from "../../middlewares/withFilters";
import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullTransaction, fullTransactionSelect } from "./common";
import { getAllInputSchema } from "./getAll.schema";

export const getAllFull = publicProcedure
  .input(getAllInputSchema)
  .use(withPagination)
  .use(withFilters)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      slotRangeFilter,
      sort,
      typeFilter,
      rollupFilter,
    } = ctx.filters;

    const [transactions, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction
        .findMany({
          select: fullTransactionSelect,
          where: {
            rollup: rollupFilter,
            block: {
              ...blockRangeFilter,
              ...slotRangeFilter,
              ...typeFilter,
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
      rollupFilter
        ? ctx.prisma.transaction.count({
            where: {
              rollup: rollupFilter,
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
