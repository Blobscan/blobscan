import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullTransaction, fullTransactionSelect } from "./common";
import { getByAddressInputSchema } from "./getByAddress.schema";

export const getByAddress = publicProcedure
  .input(paginationSchema)
  .use(withPagination)
  .input(getByAddressInputSchema)
  .query(async ({ ctx, input }) => {
    const { address } = input;
    const addressLowerCase = address.toLocaleLowerCase();

    const [transactions, totalTransactions] = await Promise.all([
      ctx.prisma.transaction
        .findMany({
          select: fullTransactionSelect,
          where: {
            OR: [{ fromId: addressLowerCase }, { toId: addressLowerCase }],
          },
          orderBy: { blockNumber: "desc" },
          ...ctx.pagination,
        })
        .then((txs) => txs.map(formatFullTransaction)),
      // FIXME: this is not efficient
      ctx.prisma.transaction.count({
        where: {
          OR: [{ fromId: addressLowerCase }, { toId: addressLowerCase }],
        },
      }),
    ]);

    return {
      transactions,
      totalTransactions,
    };
  });
