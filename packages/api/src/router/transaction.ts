import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        blobs: z.boolean().optional(),
        take: z.number().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.transaction.findMany({
        where: {
          OR: [{ from: input.from }, { to: input.to }],
        },
        include: {
          Blob: input.blobs,
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
      const tx = await ctx.prisma.transaction.findUnique({
        where: { id },
        include: {
          Blob: true,
        },
      });
      if (!tx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No tx with id '${id}'`,
        });
      }
      return tx;
    }),
});
