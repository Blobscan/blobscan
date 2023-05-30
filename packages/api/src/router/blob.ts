import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { PAGINATION_INPUTS, getPaginationParams } from "../utils/pagination";

export const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
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
        ...PAGINATION_INPUTS,
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.blob.findMany({
        select: blobSelect,
        ...getPaginationParams(input),
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
