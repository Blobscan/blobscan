import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { BUCKET_NAME } from "../env";
import { blobSelect, blobsOnTransactionsSelect } from "../queries/blob";
import { createTRPCRouter, paginatedProcedure, publicProcedure } from "../trpc";

export const blobRouter = createTRPCRouter({
  getAll: paginatedProcedure.query(async ({ ctx }) => {
    const [blobs, totalBlobs] = await Promise.all([
      ctx.prisma.blob.findMany({
        select: { ...blobSelect },
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
      const blobOnTransaction = await ctx.prisma.blobsOnTransactions.findUnique(
        {
          select: blobsOnTransactionsSelect,
          where: { txHash_index: { txHash, index } },
        },
      );

      if (!blobOnTransaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with tx hash ${txHash} and index ${index}`,
        });
      }

      const { blob, blobHash, transaction } = blobOnTransaction;

      const blobData = await ctx.storage
        .bucket(BUCKET_NAME)
        .file(blob.gsUri)
        .download();

      return {
        versionedHash: blobHash,
        txHash,
        index,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.timestamp,
        commitment: blob.commitment,
        data: blobData.toString(),
      };
    }),
});
