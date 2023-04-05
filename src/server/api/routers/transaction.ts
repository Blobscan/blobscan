import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        hash: z.string().optional(),
        blobs: z.boolean().optional(),
        take: z.number().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.transaction.findMany({
        where: {
          AND: [
            { hash: input.hash },
            { OR: [{ from: input.from }, { to: input.to }] },
          ],
        },
        include: {
          Blob: input.blobs,
        },
        take: input.take,
      });
    }),
});
