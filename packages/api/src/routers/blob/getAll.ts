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

    const where: Prisma.BlobsOnTransactionsWhereInput = {
      blockNumber: filters.blockNumber,
      blockTimestamp: filters.blockTimestamp,
      block: {
        slot: filters.blockSlot,
        transactionForks: filters.blockType,
      },
      transaction:
        filters.transactionRollup !== undefined || filters.transactionAddresses
          ? {
              rollup: filters.transactionRollup,
              OR: filters.transactionAddresses,
            }
          : undefined,
    };

    const [txsBlobs, totalBlobs] = await Promise.all([
      ctx.prisma.blobsOnTransactions.findMany({
        select: createBlobsOnTransactionsSelect(ctx.expands),
        where,
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
      ctx.prisma.blobsOnTransactions.count({
        where,
      }),
    ]);

    return {
      blobs: txsBlobs.map(serializeBlobOnTransaction),
      totalBlobs,
    };
  });
