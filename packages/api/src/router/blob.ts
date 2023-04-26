import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { DEFAULT_LIMIT } from "../constants";
import { createTRPCRouter, publicProcedure } from "../trpc";

const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
  id: false,
  versionedHash: true,
  index: true,
  commitment: true,
  data: true,
  txHash: true,
  transaction: {
    select: {
      block: {
        select: {
          number: true,
          timestamp: true,
        },
      },
    },
  },
});

export const blobRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
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
  getByIndex: publicProcedure
    .input(
      z.object({
        txHash: z.string(),
        index: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { txHash, index } = input;
      const blob = await ctx.prisma.blob.findUnique({
        select: blobSelect,
        where: { txHash_index: { txHash, index } },
      });

      if (!blob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with tx hash ${txHash} and index ${index}`,
        });
      }

      const block = blob.transaction.block;

      return {
        versionedHash: blob.versionedHash,
        index: blob.index,
        commitment: blob.commitment,
        data: blob.data,
        txHash: blob.txHash,
        blockNumber: block.number,
        timestamp: block.timestamp,
      };
    }),
});
