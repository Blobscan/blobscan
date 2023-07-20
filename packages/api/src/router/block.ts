import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { paginatedProcedure } from "../middlewares/withPagination";
import { fullBlockSelect } from "../queries/block";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const blockRouter = createTRPCRouter({
  getAll: paginatedProcedure.query(async ({ ctx }) => {
    const [blocks, totalBlocks] = await Promise.all([
      ctx.prisma.block.findMany({
        select: fullBlockSelect,
        orderBy: { number: "desc" },
        ...ctx.pagination,
      }),
      ctx.prisma.block.count(),
    ]);

    return {
      blocks,
      totalBlocks,
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
