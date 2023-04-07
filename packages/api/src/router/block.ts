import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const blockRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        transactions: z.boolean().optional(),
        take: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.block.findMany({
        where: {
          OR: [
            { number: input.id ? parseInt(input.id) : undefined },
            { hash: input.id },
          ],
        },
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
      const block = await ctx.prisma.block.findUnique({
        where: { id },
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
