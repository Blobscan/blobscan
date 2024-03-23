import { withExpands } from "../../middlewares/withExpands";
import { withFilters } from "../../middlewares/withFilters";
import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { createTransactionSelect } from "./common/selects";
import {
  addDerivedFieldsToTransaction,
  serializeTransaction,
} from "./common/serializers";
import { getByAddressInputSchema } from "./getByAddress.schema";

export const getByAddress = publicProcedure
  .input(getByAddressInputSchema)
  .use(withPagination)
  .use(withExpands)
  .use(withFilters)
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
