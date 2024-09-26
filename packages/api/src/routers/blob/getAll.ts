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
import { countBlobs } from "./getCount";

const inputSchema = withPaginationSchema
  .merge(withAllFiltersSchema)
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = z.object({
  blobs: serializedBlobOnTransactionSchema.array(),
  totalBlobs: z.number().optional(),
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
  .query(async ({ ctx: { filters, expands, pagination, prisma, count } }) => {
    const blockFiltersExists = filters.blockSlot || filters.blockType;
    const txFiltersExists =
      filters.transactionRollup !== undefined ||
      filters.transactionAddresses ||
      filters.transactionCategory !== undefined;

    const txsBlobsOp = prisma.blobsOnTransactions.findMany({
      select: createBlobsOnTransactionsSelect(expands),
      where: {
        blockNumber: filters.blockNumber,
        blockTimestamp: filters.blockTimestamp,
        block: blockFiltersExists
          ? {
              slot: filters.blockSlot,
              transactionForks: filters.blockType,
            }
          : undefined,
        transaction: txFiltersExists
          ? {
              category: filters.transactionCategory,
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
      ...pagination,
    });
    const countOp = count ? countBlobs(prisma, filters) : undefined;

    const [txsBlobs, totalBlobs] = await Promise.all([txsBlobsOp, countOp]);

    return {
      blobs: txsBlobs.map(serializeBlobOnTransaction),
      ...(count ? { totalBlobs } : {}),
    };
  });
