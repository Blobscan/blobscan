import type { BlobStorage } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";
import { z } from "@blobscan/zod";

import type { PrismaBlob, PrismaBlobOnTransaction } from "../../../schemas";
import {
  prismaBlobOnTransactionSchema,
  prismaBlobSchema,
} from "../../../schemas";
import { serialize } from "../../../utils";
import { transformPrismaTransaction } from "../../tx/common";

function buildBlobDataUrl(blobStorage: BlobStorage, blobDataUri: string) {
  switch (blobStorage) {
    case "GOOGLE": {
      return `https://storage.googleapis.com/${env.GOOGLE_STORAGE_BUCKET_NAME}/${blobDataUri}`;
    }
    case "SWARM": {
      return `https://gateway.ethswarm.org/access/${blobDataUri}`;
    }
    case "FILE_SYSTEM":
    case "POSTGRES": {
      return `${env.BLOBSCAN_API_BASE_URL}/blobs/${blobDataUri}/data`;
    }
    case "WEAVEVM": {
      return `${env.WEAVEVM_STORAGE_API_BASE_URL}/v1/blob/${blobDataUri}`;
    }
  }
}

export const fullPrismaBlobSchema = prismaBlobSchema.extend({
  transactions: z.array(
    prismaBlobOnTransactionSchema.omit({ blobHash: true }).required({
      blockHash: true,
      blockNumber: true,
      blockTimestamp: true,
      index: true,
      txHash: true,
      txIndex: true,
    })
  ),
});

export const blobSchema = fullPrismaBlobSchema.transform(
  ({ transactions, ...restBlob }) => ({
    ...transformPrismaBlob(restBlob),
    transactions: transactions.map(
      ({ transaction, block, ...restBlobOnTx }) => ({
        ...transformPrismaBlobOnTx(restBlobOnTx),
        ...(transaction
          ? {
              transaction: transformPrismaTransaction(
                transaction,
                transaction.block.blobGasPrice
              ),
            }
          : {}),
        ...(block ? { block } : {}),
      })
    ),
  })
);

export const serializedBlobSchema = blobSchema.transform(serialize);

export const blobOnTransactionSchema = prismaBlobOnTransactionSchema
  .required({
    blockHash: true,
    blockNumber: true,
    blockTimestamp: true,
    index: true,
    txHash: true,
    txIndex: true,
  })
  .required({
    blob: true,
  })
  .transform(({ block, transaction, ...restBlobOnTx }) => ({
    ...transformPrismaBlobOnTx(restBlobOnTx),
    ...(block ? { block } : {}),
    ...(transaction
      ? {
          transaction: transformPrismaTransaction(
            transaction,
            transaction.block.blobGasPrice
          ),
        }
      : {}),
  }));

export const serializedBlobOnTransactionSchema =
  blobOnTransactionSchema.transform(serialize);

export function transformPrismaBlobOnTx(
  prismaBlobOnTx: Partial<PrismaBlobOnTransaction>
) {
  const parsedBlobOnTx = prismaBlobOnTransactionSchema
    .partial({ blobHash: true })
    .passthrough()
    .safeParse(prismaBlobOnTx);

  if (!parsedBlobOnTx.success) {
    return prismaBlobOnTx;
  }

  const { blobHash, blob, ...restBlobOnTx } = parsedBlobOnTx.data;
  const transformedBlob = blob ? transformPrismaBlob(blob) : {};

  return {
    ...(blobHash ? { versionedHash: blobHash } : {}),
    ...restBlobOnTx,
    ...transformedBlob,
  };
}

export function transformPrismaBlob({
  dataStorageReferences,
  ...restPrismaBlob
}: Omit<PrismaBlob, "versionedHash"> & { versionedHash?: string }) {
  return {
    ...(dataStorageReferences
      ? {
          dataStorageReferences: dataStorageReferences?.map((ref) => ({
            storage: ref.blobStorage,
            url: buildBlobDataUrl(ref.blobStorage, ref.dataReference),
          })),
        }
      : {}),
    ...restPrismaBlob,
  };
}
