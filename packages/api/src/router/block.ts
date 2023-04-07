import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const blockRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        transactions: z.boolean().optional(),
        take: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.block.findMany({
        orderBy: { number: "desc" },
        include: {
          Transaction: input.transactions,
        },
        take: input.take,
      });
    }),
  byId: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const block = await ctx.prisma.block.findFirst({
        where: {
          OR: [{ number: id ? parseInt(id) : undefined }, { hash: id }],
        },
        include: {
          Transaction: true,
        },
      });
      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${id}'`,
        });
      }
      return block;
    }),
});
