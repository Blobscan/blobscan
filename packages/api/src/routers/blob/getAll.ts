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
import { normalize } from "../../utils";
import { countBlobs } from "./getCount";
import type { CompletedPrismaBlobOnTransaction } from "./helpers";
import {
  responseBlobOnTransactionSchema,
  createBlobsOnTransactionsSelect,
  toResponseBlobOnTransaction,
} from "./helpers";

const outputSchema = z
  .object({
    blobs: responseBlobOnTransactionSchema.array(),
    totalBlobs: z.number().optional(),
  })
  .transform(normalize);

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
  .query(
    async ({
      ctx: { filters, expands, pagination, prisma, count, chainId },
    }) => {
      const {
        blockFilters = {},
        blockType,
        transactionFilters,
        sort,
      } = filters;

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
      const countOp = count ? countBlobs(prisma, chainId, filters) : undefined;

      const [prismaBlobsOnTxs, totalBlobs] = await Promise.all([
        blobsOnTransactinonsOp,
        countOp,
      ]);

      return {
        blobs: prismaBlobsOnTxs.map((prismaBlobOnTx) =>
          toResponseBlobOnTransaction(
            prismaBlobOnTx as unknown as CompletedPrismaBlobOnTransaction
          )
        ),
        ...(count ? { totalBlobs } : {}),
      };
    }
  );
