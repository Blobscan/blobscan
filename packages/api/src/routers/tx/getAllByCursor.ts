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
import { countTxs } from "./getCount";
import type { CompletedPrismaTransaction } from "./helpers";
import {
  createTransactionSelect,
  responseTransactionSchema,
  toResponseTransaction,
} from "./helpers";

const outputSchema = z
  .object({
    pagination: paginationResponseSchema,
    transactions: responseTransactionSchema.array(),
    totalTransactions: z.number().optional(),
  })
  .transform(normalize);

export const getAllByCursor = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/transactions",
      tags: ["transactions"],
      summary: "retrieves all blob transactions.",
    },
  })
  .input(withAllFiltersSchema)
  .use(withFilters)
  .input(createExpandsSchema(["block", "blob"]))
  .use(withExpands)
  .input(withCursorPaginationSchema)
  .use(withCursorPagination)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(
    async ({
      ctx: { prisma, expands, filters, pagination, count, rollupRegistry },
    }) => {
      const {
        transactionFilters = {},
        blockFilters = {},
        blockType,
        sort,
      } = filters;

      const baseWhere: Prisma.TransactionWhereInput = {
        ...transactionFilters,
        blockNumber: blockFilters.number,
        blockTimestamp: blockFilters.timestamp,
        block: {
          slot: blockFilters.slot,
          transactionForks: blockType,
        },
      };

      const prismaTxsOp = paginate({
        sort,
        ...pagination,
        fields: [
          blockFilters.number
            ? { name: "blockNumber", type: "number" }
            : { name: "blockTimestamp", type: "date" },
          { name: "index", type: "number", nullable: true },
          { name: "hash", type: "string" },
        ],
        fetchPage: ({ where, orderBy, take }) =>
          prisma.transaction.findMany({
            select: createTransactionSelect(expands),
            where: {
              AND: [baseWhere, where as Prisma.TransactionWhereInput],
            },
            orderBy: orderBy as Prisma.TransactionOrderByWithRelationInput[],
            take,
          }),
        hasPage: (where) =>
          prisma.transaction
            .findFirst({
              where: {
                AND: [baseWhere, where as Prisma.TransactionWhereInput],
              },
              select: { hash: true },
            })
            .then(Boolean),
      });
      const countOp = count
        ? countTxs(prisma, filters, rollupRegistry)
        : Promise.resolve(undefined);

      const [{ items: prismaTxs, pagination: pageInfo }, txCountOrStats] =
        await Promise.all([prismaTxsOp, countOp]);

      return {
        pagination: pageInfo,
        transactions: prismaTxs.map((tx) =>
          toResponseTransaction(tx as unknown as CompletedPrismaTransaction)
        ),
        ...(count ? { totalTransactions: txCountOrStats } : {}),
      };
    }
  );
