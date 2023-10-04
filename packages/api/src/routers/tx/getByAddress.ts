import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { fullTransactionSelect } from "./common";
import { getByAddressInputSchema } from "./getByAddress.schema";

export const getByAddress = publicProcedure
  .input(paginationSchema)
  .use(withPagination)
  .input(getByAddressInputSchema)
  .query(async ({ ctx, input }) => {
    const { address } = input;

    const [transactions, totalTransactions] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        where: {
          OR: [{ fromId: address }, { toId: address }],
        },
        orderBy: { blockNumber: "desc" },
        ...ctx.pagination,
      }),
      ctx.prisma.transaction.count({
        where: {
          OR: [{ fromId: address }, { toId: address }],
        },
      }),
    ]);

    return {
      transactions,
      totalTransactions,
    };
  });
