import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { DEFAULT_LIMIT } from "../constants";
import { createTRPCRouter, publicProcedure } from "../trpc";

const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
  id: false,
  hash: true,
  commitment: true,
  data: true,
});

export const blobRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        transaction: z.boolean().optional(),
        limit: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      const take = input.limit ?? DEFAULT_LIMIT;

      return ctx.prisma.blob.findMany({
        select: blobSelect,
        take,
      });
    }),
  getById: publicProcedure
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
          transaction: true,
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
