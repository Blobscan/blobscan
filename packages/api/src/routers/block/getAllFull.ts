import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullBlock, fullBlockSelect } from "./common";
import { getAllInputSchema } from "./getAll.schema";

export const getAllFull = publicProcedure
  .input(getAllInputSchema)
  .use(withPagination)
  .query(async ({ input, ctx }) => {
    const [blocks, overallStats] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          orderBy: { number: "desc" },
          ...ctx.pagination,
          where: {
            transactionForks: {
              ...(input?.reorgs ? { some: {} } : { none: {} }),
            },
          },
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
