import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { blobSelect } from "./blob";
import { fullBlockSelect } from "./block";
import { fullTransactionSelect } from "./tx";

export const searchRouter = createTRPCRouter({
  searchByHash: publicProcedure
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { hash } = input;

      const transaction = await ctx.prisma.transaction.findUnique({
        select: fullTransactionSelect,
        where: {
          hash,
        },
      });

      if (transaction) {
        return {
          type: "transaction",
          id: transaction.hash,
        };
      }

      const blobs = await ctx.prisma.blob.findMany({
        select: blobSelect,
        where: {
          versionedHash: hash,
        },
      });

      if (blobs.length > 0) {
        return {
          type: "blob",
          id: `${blobs[0]?.txHash}-${blobs[0]?.index}`,
        };
      }

      const block = await ctx.prisma.block.findUnique({
        select: fullBlockSelect,
        where: {
          hash,
        },
      });

      if (block) {
        return {
          type: "block",
          data: block.hash,
        };
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No data with hash '${hash}'`,
      });
    }),
  searchByNumber: publicProcedure
    .input(
      z.object({
        number: z.number(),
      }),
    )
    .query(({ ctx, input }) => {
      const { number } = input;

      return ctx.prisma.block.findMany({
        select: fullBlockSelect,
        where: {
          OR: [{ number }, { slot: number }],
        },
      });
    }),
});
