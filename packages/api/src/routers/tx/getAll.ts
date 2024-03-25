import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import {
  withPaginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import {
  createTransactionSelect,
  serializeTransaction,
  addDerivedFieldsToTransaction,
  serializedTransactionSchema,
} from "./common";

const inputSchema = withAllFiltersSchema
  .merge(createExpandsSchema(["block", "blob"]))
  .merge(withPaginationSchema)
  .optional();

const outputSchema = z.object({
  transactions: serializedTransactionSchema.array(),
  totalTransactions: z.number(),
});

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions",
      tags: ["transactions"],
      summary: "retrieves all blob transactions.",
    },
  })
  .input(inputSchema)
  .use(withFilters)
  .use(withExpands)
  .use(withPagination)
  .output(outputSchema)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      slotRangeFilter,
      rollupFilter,
      sort,
      typeFilter,
    } = ctx.filters;

    const [queriedTxs, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: createTransactionSelect(ctx.expands),
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

    return {
      transactions: queriedTxs
        .map(addDerivedFieldsToTransaction)
        .map(serializeTransaction),
      totalTransactions:
        typeof txCountOrStats === "number"
          ? txCountOrStats
          : txCountOrStats?.totalTransactions ?? 0,
    };
  });
