import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { blobSelect } from "../queries/blob";
import { createTRPCRouter, paginatedProcedure, publicProcedure } from "../trpc";

export const blobRouter = createTRPCRouter({
  getAll: paginatedProcedure.query(async ({ ctx }) => {
    const [blobs, totalBlobs] = await Promise.all([
      ctx.prisma.blob.findMany({
        select: { ...blobSelect, data: false },
        ...ctx.pagination,
      }),
      ctx.prisma.blob.count(),
    ]);

    return {
      blobs,
      totalBlobs,
    };
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
