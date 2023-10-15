import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { fullTransactionSelect } from "./common";

export const getAll = publicProcedure
  .input(paginationSchema)
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [transactions, overallStats] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        orderBy: { blockNumber: "desc" },
        ...ctx.pagination,
      }),
      ctx.prisma.transactionOverallStats.findFirst({
        select: {
          totalTransactions: true,
        },
      }),
    ]);

    return {
      transactions,
      totalTransactions: overallStats?.totalTransactions ?? 0,
    };
  });
