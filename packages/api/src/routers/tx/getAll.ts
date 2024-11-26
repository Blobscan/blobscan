import type { Prisma } from "@blobscan/db";
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
import { countTxs } from "./getCount";

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
    const blockFiltersExists = filters.blockSlot || filters.blockType;
    let leadingOrderColumn: Prisma.TransactionOrderByWithRelationInput = {
      blockTimestamp: filters.sort,
    };

    if (filters.blockNumber) {
      leadingOrderColumn = {
        blockNumber: filters.sort,
      };
    }

    const transactionsOp = prisma.transaction.findMany({
      select: createTransactionSelect(expands),
      where: {
        blockNumber: filters.blockNumber,
        blockTimestamp: filters.blockTimestamp,
        rollup: filters.transactionRollup,
        OR: filters.transactionAddresses,
        block: blockFiltersExists
          ? {
              slot: filters.blockSlot,
              transactionForks: filters.blockType,
            }
          : undefined,
      },
      orderBy: [
        leadingOrderColumn,
        {
          index: filters.sort,
        },
      ],
      ...pagination,
    });
    const countOp = count
      ? countTxs(prisma, filters)
      : Promise.resolve(undefined);

    const [queriedTxs, txCountOrStats] = await Promise.all([
      transactionsOp,
      countOp,
    ]);

    const transactions = await Promise.all(
      queriedTxs.map(addDerivedFieldsToTransaction).map(serializeTransaction)
    );

    return {
      transactions,
      ...(count ? { totalTransactions: txCountOrStats } : {}),
    };
  });
