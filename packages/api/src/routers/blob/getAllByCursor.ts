import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  withCursorPaginationSchema,
  withCursorPagination,
} from "../../middlewares/withCursorPagination";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { paginate, paginationResponseSchema } from "../../pagination";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { countBlobs } from "./getCount";
import type { CompletedPrismaBlobOnTransaction } from "./helpers";
import {
  createBlobListWhere,
  responseBlobOnTransactionSchema,
  createBlobsOnTransactionsSelect,
  toResponseBlobOnTransaction,
} from "./helpers";

const outputSchema = z
  .object({
    pagination: paginationResponseSchema,
    blobs: responseBlobOnTransactionSchema.array(),
    totalBlobs: z.number().optional(),
  })
  .transform(normalize);

export const getAllByCursor = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/blobs",
      tags: ["blobs"],
      summary: "retrieves all blobs.",
    },
  })
  .input(withCursorPaginationSchema)
  .use(withCursorPagination)
  .input(withAllFiltersSchema)
  .use(withFilters)
  .input(createExpandsSchema(["transaction", "block"]))
  .use(withExpands)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(
    async ({
      ctx: { count, expands, filters, pagination, prisma, rollupRegistry },
    }) => {
      const { blockFilters = {}, sort } = filters;

      const baseWhere = createBlobListWhere(filters);

      const blobsOnTransactinonsOp = paginate({
        sort,
        ...pagination,
        fields: [
          blockFilters.number
            ? { name: "blockNumber", type: "number" }
            : { name: "blockTimestamp", type: "date" },
          { name: "txIndex", type: "number" },
          { name: "index", type: "number" },
          { name: "txHash", type: "string" },
        ],
        fetchPage: ({ where, orderBy, take }) =>
          prisma.blobsOnTransactions.findMany({
            select: createBlobsOnTransactionsSelect(expands),
            where: {
              AND: [baseWhere, where as Prisma.BlobsOnTransactionsWhereInput],
            },
            orderBy:
              orderBy as Prisma.BlobsOnTransactionsOrderByWithRelationInput[],
            take,
          }),
      });
      const countOp = count
        ? countBlobs(prisma, rollupRegistry, filters)
        : undefined;

      const [{ items: prismaBlobsOnTxs, pagination: pageInfo }, totalBlobs] =
        await Promise.all([blobsOnTransactinonsOp, countOp]);

      return {
        pagination: pageInfo,
        blobs: prismaBlobsOnTxs.map((prismaBlobOnTx) =>
          toResponseBlobOnTransaction(
            prismaBlobOnTx as unknown as CompletedPrismaBlobOnTransaction
          )
        ),
        ...(count ? { totalBlobs } : {}),
      };
    }
  );
