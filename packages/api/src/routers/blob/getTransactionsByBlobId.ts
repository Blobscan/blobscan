import { TRPCError } from "@trpc/server";

import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import {
  withCursorPagination,
  withCursorPaginationSchema,
} from "../../middlewares/withCursorPagination";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withFilters,
  withSortFilterSchema,
  withTypeFilterSchema,
} from "../../middlewares/withFilters";
import { paginate, paginationResponseSchema } from "../../pagination";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import type { CompletedPrismaBlobTransaction } from "./helpers";
import {
  createBlobTransactionSelect,
  findTransactionsEthUsdPrices,
  responseBlobTransactionSchema,
  toResponseBlobTransaction,
} from "./helpers";

const outputSchema = z
  .object({
    pagination: paginationResponseSchema,
    transactions: responseBlobTransactionSchema.array(),
    totalTransactions: z.number().optional(),
  })
  .transform(normalize);

/**
 * The transactions of a blob, with cursor pagination. A blob is normally in one
 * transaction, but it can be posted again: mainnet has 2024 blobs in tens of
 * thousands of transactions. The rows do not repeat the blob (get it with
 * `GET /v2/blobs/{id}`); with `expand=transaction` they have the transaction
 * fields and the ETH/USD prices of `GET /blobs/{id}`'s `transactions`.
 */
export const getTransactionsByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v2/blobs/{id}/transactions",
      tags: ["beta"],
      summary:
        "retrieves the transactions of the blob with the given versioned hash or kzg commitment.",
    },
  })
  .input(z.object({ id: z.string() }))
  .input(withCursorPaginationSchema)
  .use(withCursorPagination)
  .input(withSortFilterSchema.merge(withTypeFilterSchema))
  .use(withFilters)
  .input(createExpandsSchema(["transaction", "block"]))
  .use(withExpands)
  .output(outputSchema)
  .query(
    async ({
      ctx: { count, expands, filters, pagination, prisma },
      input: { id },
    }) => {
      const blob = await prisma.blob.findFirst({
        select: { versionedHash: true },
        where: { OR: [{ versionedHash: id }, { commitment: id }] },
      });

      if (!blob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with versioned hash or kzg commitment '${id}'.`,
        });
      }

      const baseWhere: Prisma.BlobsOnTransactionsWhereInput = {
        blobHash: blob.versionedHash,
        block: { transactionForks: filters.blockType },
      };

      const [{ items, pagination: pageInfo }, totalTransactions] =
        await Promise.all([
          paginate({
            sort: filters.sort,
            ...pagination,
            // The order of `GET /v2/blobs`, which is total.
            fields: [
              { name: "blockTimestamp", type: "date" },
              { name: "txIndex", type: "number" },
              { name: "index", type: "number" },
              { name: "txHash", type: "string" },
            ],
            fetchPage: ({ where, orderBy, take }) =>
              prisma.blobsOnTransactions.findMany({
                select: createBlobTransactionSelect(expands),
                where: {
                  AND: [
                    baseWhere,
                    where as Prisma.BlobsOnTransactionsWhereInput,
                  ],
                },
                orderBy:
                  orderBy as Prisma.BlobsOnTransactionsOrderByWithRelationInput[],
                take,
              }),
          }),
          count
            ? prisma.blobsOnTransactions.count({ where: baseWhere })
            : undefined,
        ]);

      const blobTransactions =
        items as unknown as CompletedPrismaBlobTransaction[];
      const isExpandEnabled = !!expands.block || !!expands.transaction;
      const ethUsdPrices = isExpandEnabled
        ? await findTransactionsEthUsdPrices(prisma, blobTransactions)
        : [];

      return {
        pagination: pageInfo,
        transactions: blobTransactions.map((blobTransaction, i) =>
          toResponseBlobTransaction(blobTransaction, ethUsdPrices[i])
        ),
        totalTransactions,
      };
    }
  );
