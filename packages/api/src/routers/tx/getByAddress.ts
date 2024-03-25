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
import {
  createTransactionSelect,
  addDerivedFieldsToTransaction,
  serializeTransaction,
} from "./common";

const inputSchema = z
  .object({
    address: z.string(),
  })
  .merge(createExpandsSchema(["block", "blob"]))
  .merge(withAllFiltersSchema)
  .merge(withPaginationSchema);

export const getByAddress = publicProcedure
  .input(inputSchema)
  .use(withExpands)
  .use(withFilters)
  .use(withPagination)
  .query(async ({ ctx: { prisma, expands, filters, pagination }, input }) => {
    const addressLowerCase = input.address.toLowerCase();

    const [rawTxs, totalTransactions] = await Promise.all([
      prisma.transaction.findMany({
        select: createTransactionSelect(expands),
        where: {
          OR: [{ fromId: addressLowerCase }, { toId: addressLowerCase }],
        },
        orderBy: {
          block: {
            number: filters.sort,
          },
        },
        ...pagination,
      }),
      // FIXME: this is not efficient
      prisma.transaction.count({
        where: {
          OR: [{ fromId: addressLowerCase }, { toId: addressLowerCase }],
        },
      }),
    ]);

    const transactions = rawTxs
      .map(addDerivedFieldsToTransaction)
      .map(serializeTransaction);

    return {
      transactions,
      totalTransactions,
    };
  });
