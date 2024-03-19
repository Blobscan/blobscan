import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullBlock, fullBlockSelect } from "./common";
import { getAllBlocksInputSchema } from "./getAll.schema";

export const getAllFull = publicProcedure
  .input(getAllBlocksInputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const { sort, type, rollup, startBlock, endBlock } = input;

    const [blocks, overallStats] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          where: {
            number: {
              lt: endBlock,
              gte: startBlock,
            },
            transactions: rollup
              ? {
                  some: {
                    rollup,
                  },
                }
              : undefined,
            transactionForks: {
              [type === "reorg" ? "some" : "none"]: {},
            },
          },
          orderBy: { number: sort },
          ...ctx.pagination,
        })
        .then((blocks) => blocks.map(formatFullBlock)),
      ctx.prisma.blockOverallStats.findFirst({
        select: {
          totalBlocks: true,
        },
      }),
    ]);

    return {
      blocks,
      totalBlocks: overallStats?.totalBlocks ?? 0,
    };
  });
