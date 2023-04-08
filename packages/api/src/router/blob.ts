import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const blobRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        transaction: z.boolean().optional(),
        take: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.blob.findMany({
        include: {
          Transaction: input.transaction,
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
      const blob = await ctx.prisma.blob.findUnique({
        where: { id },
        include: {
          Transaction: true,
        },
      });
      if (!blob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with id '${id}'`,
        });
      }
      return blob;
    }),
});
