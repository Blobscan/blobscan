import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { BlobReference } from "@blobscan/blob-storage-manager";

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
      })
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
      const blobReferences = blob.dataStorageReferences.map<BlobReference>(
        ({ blobStorage, dataReference }) => ({
          storage: blobStorage,
          reference: dataReference,
        })
      );
      const blobData = await blobStorageManager.getBlob(...blobReferences);

      if (!blobData) {
        const uris = blobReferences
          .map(({ reference, storage }) => `${storage}:${reference}`)
          .join(", ");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob data found on the following storage URIs: ${uris}`,
        });
      }

      return {
        versionedHash: blobHash,
        txHash,
        index,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.block.timestamp,
        commitment: blob.commitment,
        data: blobData.data.toString(),
        size: blob.size,
      };
    }),
});
