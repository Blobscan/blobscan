import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const blockRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        blockId: z.string().optional(),
        transactions: z.boolean().optional(),
        take: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.block.findMany({
        where: {
          OR: [
            { number: input.blockId ? parseInt(input.blockId) : undefined },
            { hash: input.blockId },
          ],
        },
        orderBy: { number: "desc" },
        include: {
          Transaction: input.transactions,
        },
        take: input.take,
      });
    }),
});
