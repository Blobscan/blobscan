import { withPagination } from "../../middlewares/withPagination";
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
  .query(async ({ input, ctx }) => {
    const { sort, endBlock, startBlock, type, rollup } = input;

    const [blocks, totalBlocks] = await Promise.all([
      ctx.prisma.block
        .findMany({
          select: fullBlockSelect,
          where: {
            number: {
              lt: endBlock,
              gte: startBlock,
            },
            transactionForks: {
              [type === "reorg" ? "some" : "none"]: {},
            },
            transactions: rollup
              ? {
                  some: {
                    rollup,
                  },
                }
              : undefined,
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
