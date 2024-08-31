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
  addDerivedFieldsToTransaction,
  createTransactionSelect,
  serializeTransaction,
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
    const filters = ctx.filters;

    const [queriedTxs, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: createTransactionSelect(ctx.expands),
        where: {
          blockNumber: filters.blockNumber,
          blockTimestamp: filters.blockTimestamp,
          rollup: filters.transactionRollup,
          OR: filters.transactionAddresses,
          block: filters.blockSlot
            ? {
                slot: filters.blockSlot,
              }
            : undefined,
          transactionForks: filters.blockType,
        },
        orderBy: [
          {
            blockNumber: filters.sort,
          },
          {
            index: filters.sort,
          },
        ],
        ...ctx.pagination,
      }),
      filters.transactionRollup !== undefined || filters.transactionAddresses
        ? ctx.prisma.transaction.count({
            where: {
              rollup: filters.transactionRollup,
              OR: filters.transactionAddresses,
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
