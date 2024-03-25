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
    const {
      blockRangeFilter,
      slotRangeFilter,
      sort,
      typeFilter,
      rollupFilter,
    } = ctx.filters;

    const [txsBlobs, blobCountOrStats] = await Promise.all([
      ctx.prisma.blobsOnTransactions.findMany({
        select: createBlobsOnTransactionsSelect(ctx.expands),
        where: {
          transaction: {
            rollup: rollupFilter,
            block: {
              ...blockRangeFilter,
              ...slotRangeFilter,
              ...typeFilter,
            },
          },
        },
        orderBy: [
          {
            transaction: {
              block: {
                number: sort,
              },
            },
          },
          {
            txHash: sort,
          },
          {
            index: sort,
          },
        ],
        ...ctx.pagination,
      }),
      // TODO: this is a workaround while we don't have proper rollup counts on the overall stats
      rollupFilter
        ? ctx.prisma.blob.count({
            where: {
              transactions: {
                some: {
                  transaction: {
                    rollup: rollupFilter,
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
