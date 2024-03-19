import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { baseGetAllInputSchema } from "../../utils";
import { transactionSelect, serializeTransaction } from "./common";
import { getAllOutputSchema } from "./getAll.schema";
import type { GetAllOutput } from "./getAll.schema";

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions",
      tags: ["transactions"],
      summary: "retrieves all blob transactions.",
    },
  })
  .input(baseGetAllInputSchema)
  .output(getAllOutputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const { sort, endBlock, rollup, startBlock } = input;

    const [rawTransactions, txCountOrStats] = await Promise.all([
      ctx.prisma.transaction.findMany({
        select: transactionSelect,
        where: {
          rollup,
          block: {
            number: {
              lt: endBlock,
              gte: startBlock,
            },
          },
        },
        orderBy: [
          {
            block: {
              number: sort,
            },
          },
          {
            hash: sort,
          },
        ],
        ...ctx.pagination,
      }),
      rollup
        ? ctx.prisma.transaction.count({
            where: {
              rollup,
            },
          })
        : ctx.prisma.transactionOverallStats.findFirst({
            select: {
              totalTransactions: true,
            },
          }),
    ]);

    const transactions: GetAllOutput["transactions"] =
      rawTransactions.map(serializeTransaction);

    return {
      transactions,
      totalTransactions:
        typeof txCountOrStats === "number"
          ? txCountOrStats
          : txCountOrStats?.totalTransactions ?? 0,
    };
  });
