import { TRPCError } from "@trpc/server";

import type { BlobReference } from "@blobscan/blob-storage-manager";

import { publicProcedure } from "../../procedures";
import { getByVersionedHashInputSchema } from "./getByVersionedHash.schema";

export const getByVersionedHash = publicProcedure
  .input(getByVersionedHashInputSchema)
  .query(async ({ ctx: { prisma, blobStorageManager }, input }) => {
    const { versionedHash } = input;
    const blob = await prisma.blob.findUnique({
      select: {
        versionedHash: true,
        commitment: true,
        size: true,
        dataStorageReferences: {
          select: {
            blobStorage: true,
            dataReference: true,
          },
        },
      },
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
  });
