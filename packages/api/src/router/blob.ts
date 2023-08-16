import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { BlobReference } from "@blobscan/blob-storage-manager";

import {
  PAGINATION_SCHEMA,
  withPagination,
} from "../middlewares/withPagination";
import { publicProcedure } from "../procedures";
import { blobSelect, fullBlobSelect } from "../queries/blob";
import { createTRPCRouter } from "../trpc";

export const blobRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(PAGINATION_SCHEMA)
    .use(withPagination)
    .query(async ({ ctx }) => {
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
  getByVersionedHash: publicProcedure
    .input(
      z.object({
        versionedHash: z.string(),
      })
    )
    .query(async ({ ctx: { prisma, blobStorageManager }, input }) => {
      const { versionedHash } = input;
      const blob = await prisma.blob.findUnique({
        select: fullBlobSelect,
        where: {
          versionedHash,
        },
      });

      if (!blob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with hash ${versionedHash} found`,
        });
      }

      const blobReferences = blob.dataStorageReferences.map<BlobReference>(
        ({ blobStorage, dataReference }) => ({
          storage: blobStorage,
          reference: dataReference,
        })
      );

      let blobData: Awaited<ReturnType<typeof blobStorageManager.getBlob>>;

      try {
        blobData = await blobStorageManager.getBlob(...blobReferences);
      } catch (err) {
        const err_ = err as Error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err_.message,
          cause: err_,
        });
      }

      if (!blobData) {
        const storageReferences = blobReferences
          .map(({ reference, storage }) => `${storage}:${reference}`)
          .join(", ");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob data found on the following storage references: ${storageReferences}`,
        });
      }

      return {
        ...blob,
        data: blobData.data,
      };
    }),
});
