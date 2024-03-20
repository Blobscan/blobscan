import { filtersSchema, withFilters } from "../../middlewares/withFilters";
import {
  paginationSchema,
  withPagination,
} from "../../middlewares/withPagination";
import { publicProcedure } from "../../procedures";
import { formatFullBlockForApi, fullBlockSelect } from "./common";
import {
  getAllBlocksInputSchema,
  getAllBlocksOutputSchema,
} from "./getAll.schema";

export const getAll = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blocks",
      tags: ["blocks"],
      summary: "retrieves all blocks.",
    },
  })
  .input(getAllBlocksInputSchema)
  .output(getAllBlocksOutputSchema)
  .use(withPagination)
  .use(withFilters)
  .query(async ({ ctx }) => {
    const {
      blockRangeFilter,
      rollupFilter,
      slotRangeFilter,
      typeFilter,
      sort,
    } = ctx.filters;

    const [blocks, totalBlocks] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          where: {
            ...blockRangeFilter,
            ...slotRangeFilter,
            ...typeFilter,
            transactions: {
              some: {
                rollup: rollupFilter,
              },
            },
          },
          orderBy: { number: sort },
          ...ctx.pagination,
        })
        .then((blocks) => blocks.map(formatFullBlockForApi)),
      ctx.prisma.blockOverallStats
        .findFirst({
          select: {
            totalBlocks: true,
          },
        })
        .then((stats) => stats?.totalBlocks ?? 0),
    ]);

    return {
      blocks,
      totalBlocks,
    };
  });
