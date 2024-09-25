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
  totalTransactions: z.number().optional(),
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
  .query(async ({ ctx: { prisma, expands, filters, pagination, count } }) => {
    const transactionsOp = prisma.transaction.findMany({
      select: createTransactionSelect(expands),
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
      ...pagination,
    });
    const countOp = count
      ? filters.transactionRollup !== undefined || filters.transactionAddresses
        ? prisma.transaction.count({
            where: {
              rollup: filters.transactionRollup,
              OR: filters.transactionAddresses,
            },
          })
        : prisma.transactionOverallStats
            .findFirst({
              select: {
                totalTransactions: true,
              },
            })
            .then((stats) => stats?.totalTransactions ?? 0)
      : Promise.resolve(undefined);

    const [queriedTxs, txCountOrStats] = await Promise.all([
      transactionsOp,
      countOp,
    ]);

    return {
      transactions: queriedTxs
        .map(addDerivedFieldsToTransaction)
        .map(serializeTransaction),
      ...(count ? { totalTransactions: txCountOrStats } : {}),
    };
  });
