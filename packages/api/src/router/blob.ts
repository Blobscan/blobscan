import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { paginatedProcedure } from "../middlewares/withPagination";
import { blobSelect, blobsOnTransactionsSelect } from "../queries/blob";
import { createTRPCRouter, publicProcedure } from "../trpc";

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
    .query(async ({ ctx: { prisma, blobStorageManager }, input }) => {
      const { txHash, index } = input;
      const blobOnTransaction = await prisma.blobsOnTransactions.findUnique({
        select: blobsOnTransactionsSelect,
        where: { txHash_index: { txHash, index } },
      });

      if (!blobOnTransaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with tx hash ${txHash} and index ${index}`,
        });
      }

      const { blob, blobHash, transaction } = blobOnTransaction;

      const blobData = await blobStorageManager.getBlob([
        {
          storage: "google",
          reference: blob.gsUri,
        },
        { storage: "swarm", reference: blob.swarmHash },
      ]);

      if (!blobData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob data with gs uri ${blob.gsUri} or swarm hash ${blob.swarmHash}`,
        });
      }

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
