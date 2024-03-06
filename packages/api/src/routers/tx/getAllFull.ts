import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullTransaction, fullTransactionSelect } from "./common";
import { getAllInputSchema } from "./getAll.schema";

export const getAllFull = publicProcedure
  .input(getAllInputSchema)
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [transactions, overallStats] = await Promise.all([
      ctx.prisma.transaction
        .findMany({
          select: fullTransactionSelect,
          orderBy: {
            block: {
              number: "desc",
            },
          },
          ...ctx.pagination,
        })
        .then((txs) => txs.map(formatFullTransaction)),
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
