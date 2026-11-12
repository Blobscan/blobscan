import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
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
import { countTxs } from "./getCount";
import type { CompletedPrismaTransaction } from "./helpers";
import {
  createTransactionListWhere,
  createTransactionSelect,
  responseTransactionSchema,
  toResponseTransaction,
} from "./helpers";

const outputSchema = z
  .object({
    transactions: responseTransactionSchema.array(),
    totalTransactions: z.number().optional(),
  })
  .transform(normalize);

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions",
      tags: ["transactions"],
      summary: "retrieves all blob transactions.",
    },
  })
  .input(withAllFiltersSchema)
  .use(withFilters)
  .input(createExpandsSchema(["block", "blob"]))
  .use(withExpands)
  .input(withPaginationSchema)
  .use(withPagination)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(
    async ({
      ctx: { prisma, expands, filters, pagination, count, rollupRegistry },
    }) => {
      const { blockFilters = {}, sort } = filters;

      let leadingOrderColumn: Prisma.TransactionOrderByWithRelationInput = {
        blockTimestamp: sort,
      };

      if (blockFilters.number) {
        leadingOrderColumn = {
          blockNumber: sort,
        };
      }

      const prismaTxsOp = prisma.transaction.findMany({
        select: createTransactionSelect(expands),
        where: createTransactionListWhere(filters),
        orderBy: [
          leadingOrderColumn,
          {
            index: sort,
          },
        ],
        ...pagination,
      });

      const countOp = count
        ? countTxs(prisma, filters, rollupRegistry)
        : Promise.resolve(undefined);

      const [prismaTxs, txCountOrStats] = await Promise.all([
        prismaTxsOp,
        countOp,
      ]);

      return {
        transactions: prismaTxs.map((tx) =>
          toResponseTransaction(tx as unknown as CompletedPrismaTransaction)
        ),
        ...(count ? { totalTransactions: txCountOrStats } : {}),
      };
    }
  );
