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
import { createBlobsOnTransactionsSelect } from "./common/selects";
import {
  serializeBlobOnTransaction,
  serializedBlobOnTransactionSchema,
} from "./common/serializers";

const inputSchema = withPaginationSchema
  .merge(withAllFiltersSchema)
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = z.object({
  blobs: serializedBlobOnTransactionSchema.array(),
  totalBlobs: z.number(),
});

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs",
      tags: ["blobs"],
      summary: "retrieves all blobs.",
    },
  })
  .input(inputSchema)
  .use(withPagination)
  .use(withFilters)
  .use(withExpands)
  .output(outputSchema)
  .query(async ({ ctx }) => {
    const filters = ctx.filters;

    const [txsBlobs, blobCountOrStats] = await Promise.all([
      ctx.prisma.blobsOnTransactions.findMany({
        select: createBlobsOnTransactionsSelect(ctx.expands),
        where: {
          blockNumber: filters.blockNumber,
          blockTimestamp: filters.blockTimestamp,
          block: {
            slot: filters.blockSlot,
            transactionForks: filters.blockType,
          },
          transaction:
            filters.transactionRollup !== undefined ||
            filters.transactionAddresses
              ? {
                  rollup: filters.transactionRollup,
                  OR: filters.transactionAddresses,
                }
              : undefined,
        },
        orderBy: [
          { blockNumber: filters.sort },
          {
            transaction: {
              index: filters.sort,
            },
          },
          {
            index: filters.sort,
          },
        ],
        ...ctx.pagination,
      }),
      // TODO: this is a workaround while we don't have proper rollup counts on the overall stats
      filters.transactionRollup !== undefined || filters.transactionAddresses
        ? ctx.prisma.blob.count({
            where: {
              transactions: {
                some: {
                  transaction: {
                    rollup: filters.transactionRollup,
                    OR: filters.transactionAddresses,
                  },
                },
              },
            },
          })
        : ctx.prisma.blobOverallStats.findFirst({
            select: {
              totalBlobs: true,
            },
          }),
    ]);

    return {
      blobs: txsBlobs.map(serializeBlobOnTransaction),
      totalBlobs:
        typeof blobCountOrStats === "number"
          ? blobCountOrStats
          : blobCountOrStats?.totalBlobs ?? 0,
    };
  });
