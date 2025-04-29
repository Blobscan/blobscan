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
import type { BlobOnTransaction } from "./common/selects";
import { createBlobsOnTransactionsSelect } from "./common/selects";
import {
  serializeBlobOnTransaction,
  serializedBlobOnTransactionSchema,
} from "./common/serializers";
import { countBlobs } from "./getCount";

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
  .input(withPaginationSchema)
  .use(withPagination)
  .input(withAllFiltersSchema)
  .use(withFilters)
  .input(createExpandsSchema(["transaction", "block"]))
  .use(withExpands)
  .output(outputSchema)
  .query(async ({ ctx: { filters, expands, pagination, prisma, count } }) => {
    const { blockFilters = {}, blockType, transactionFilters, sort } = filters;

    let leadingOrderColumn: Prisma.BlobsOnTransactionsOrderByWithRelationInput =
      {
        blockTimestamp: sort,
      };

    if (blockFilters.number) {
      leadingOrderColumn = {
        blockNumber: sort,
      };
    }

    const blobsOnTransactinonsOp = prisma.blobsOnTransactions.findMany({
      select: createBlobsOnTransactionsSelect(expands),
      where: {
        blockNumber: blockFilters.number,
        blockTimestamp: blockFilters.timestamp,
        block: {
          slot: blockFilters.slot,
          transactionForks: blockType,
        },

        transaction: transactionFilters,
      },
      orderBy: [
        leadingOrderColumn,
        { txIndex: sort },
        {
          index: sort,
        },
      ],
      ...pagination,
    });
    const countOp = count ? countBlobs(prisma, filters) : undefined;

    const [queriedBlobsOnTxs, totalBlobs] = await Promise.all([
      blobsOnTransactinonsOp,
      countOp,
    ]);

    const blobsOnTransactions =
      queriedBlobsOnTxs as unknown as BlobOnTransaction[];

    const output: z.infer<typeof outputSchema> = {
      blobs: blobsOnTransactions.map(serializeBlobOnTransaction),
    };

    if (count) {
      output.totalBlobs = totalBlobs;
    }

    return output;
  });
