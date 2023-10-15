import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { fullBlockSelect } from "./common";

export const getAll = publicProcedure
  .input(paginationSchema)
  .use(withPagination)
  .query(async ({ ctx }) => {
    const [blocks, overallStats] = await Promise.all([
      ctx.prisma.block.findMany({
        select: fullBlockSelect,
        orderBy: { number: "desc" },
        ...ctx.pagination,
      }),
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
