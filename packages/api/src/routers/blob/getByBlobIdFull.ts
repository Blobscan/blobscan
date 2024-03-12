import { TRPCError } from "@trpc/server";

import type { BlobReference } from "@blobscan/blob-storage-manager";

import { publicProcedure } from "../../procedures";
import { getByBlobIdInputSchema } from "./getByBlobId.schema";

export const getByBlobIdFull = publicProcedure
  .input(getByBlobIdInputSchema)
  .query(async ({ ctx: { prisma, blobStorageManager }, input }) => {
    const { id } = input;

    const blob = await prisma.blob.findFirst({
      select: {
        versionedHash: true,
        commitment: true,
        proof: true,
        size: true,
        dataStorageReferences: {
          select: {
            blobStorage: true,
            dataReference: true,
          },
        },
        transactions: {
          distinct: ["txHash"],
          select: {
            transaction: {
              select: {
                hash: true,
                block: {
                  select: {
                    number: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        OR: [{ versionedHash: id }, { commitment: id }],
      },
    });

    if (!blob) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob with versioned hash or kzg commitment '${id}'.`,
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

    const { transactions, ...blobMetadata } = blob;
    const transactionsWithBlocks = transactions.map(
      ({
        transaction: {
          hash,
          block: { number },
        },
      }) => ({ txHash: hash, blockNumber: number })
    );

    return {
      ...blobMetadata,
      transactionsWithBlocks,
      data: blobData.data,
    };
  });
