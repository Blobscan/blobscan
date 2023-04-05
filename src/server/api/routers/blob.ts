import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const blobRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        blobId: z.string().optional(),
        txHash: z.string().optional(),
        transaction: z.boolean().optional(),
        take: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.blob.findMany({
        where: {
          OR: [{ hash: input.blobId }, { tx: input.blobId }],
        },
        include: {
          Transaction: input.transaction,
        },
        take: input.take,
      });
    }),
});
