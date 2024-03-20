import { withFilters } from "../../middlewares/withFilters";
import { withPagination } from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullBlock, fullBlockSelect } from "./common";
import { getAllBlocksInputSchema } from "./getAll.schema";

export const getAllFull = publicProcedure
  .input(getAllBlocksInputSchema)
  .use(withPagination)
  .use(withFilters)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      rollupFilter,
      slotRangeFilter,
      sort,
      typeFilter,
    } = ctx.filters;

    const [blocks, overallStats] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          where: {
            ...blockRangeFilter,
            ...slotRangeFilter,
            ...typeFilter,
            transactions: rollupFilter
              ? {
                  some: {
                    rollup: rollupFilter,
                  },
                }
              : undefined,
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
