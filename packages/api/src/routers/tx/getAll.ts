import { withFilters } from "../../middlewares/withFilters";
import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { transactionSelect, serializeTransaction } from "./common";
import { getAllInputSchema, getAllOutputSchema } from "./getAll.schema";
import type { GetAllOutput } from "./getAll.schema";

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
  .use(withFilters)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      slotRangeFilter,
      rollupFilter,
      sort,
      typeFilter,
    } = ctx.filters;

    const [rawTransactions, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: transactionSelect,
        where: {
          rollup: rollupFilter,
          block: {
            ...blockRangeFilter,
            ...slotRangeFilter,
            ...typeFilter,
          },
        },
        orderBy: [
          {
            block: {
              number: sort,
            },
          },
          {
            hash: sort,
          },
        ],
        ...ctx.pagination,
      }),
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

    const transactions: GetAllOutput["transactions"] =
      rawTransactions.map(serializeTransaction);

    return {
      transactions,
      totalTransactions:
        typeof txCountOrStats === "number"
          ? txCountOrStats
          : txCountOrStats?.totalTransactions ?? 0,
    };
  });
