import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  PAGINATION_SCHEMA,
  withPagination,
} from "../middlewares/withPagination";
import { publicProcedure } from "../procedures";
import { fullBlockSelect } from "../queries/block";
import { createTRPCRouter } from "../trpc";

export const blockRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(PAGINATION_SCHEMA)
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
    }),
  getByHash: publicProcedure
    .input(
      z.object({
        hash: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { hash } = input;

      const block = await ctx.prisma.block.findUnique({
        select: fullBlockSelect,
        where: {
          hash,
        },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with hash '${hash}'`,
        });
      }

      return block;
    }),
  getByBlockNumber: publicProcedure
    .input(
      z.object({
        number: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { number } = input;

      const block = await ctx.prisma.block.findUnique({
        select: fullBlockSelect,
        where: {
          number,
        },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with number '${number}'`,
        });
      }

      return block;
    }),
});
