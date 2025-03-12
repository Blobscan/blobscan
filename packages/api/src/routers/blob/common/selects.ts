import type { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import { dataStorageReferencesSelect } from "../../../utils";

export const baseBlobSelect = {
  commitment: true,
  proof: true,
  size: true,
  versionedHash: true,
  dataStorageReferences: {
    select: dataStorageReferencesSelect,
    orderBy: {
      blobStorage: "asc",
    },
  },
} satisfies Prisma.BlobSelect;

export const baseBlobOnTransactionSelect = {
  blobHash: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  index: true,
  txHash: true,
  txIndex: true,
} satisfies Prisma.BlobsOnTransactionsSelect;

export function createBlobSelect(expands: Expands) {
  const blockExpand = expands.block ? { block: expands.block } : {};
  const txExpand = expands.transaction
    ? {
        transaction: {
          select: {
            ...expands.transaction.select,
            block: {
              select: {
                blobGasPrice: true,
              },
            },
          },
        },
      }
    : {};

  return {
    ...baseBlobSelect,
    transactions: {
      select: {
        ...baseBlobOnTransactionSelect,
        blobHash: false,
        ...blockExpand,
        ...txExpand,
      },
    },
  } satisfies Prisma.BlobSelect;
}

export function createBlobsOnTransactionsSelect(expands: Expands) {
  const blockExpand = expands.block ? { block: expands.block } : {};
  const txExpand = expands.transaction
    ? {
        transaction: {
          select: {
            ...expands.transaction.select,
            block: {
              select: {
                blobGasPrice: true,
              },
            },
          },
        },
      }
    : {};

  return {
    ...baseBlobOnTransactionSelect,
    blob: {
      select: baseBlobSelect,
    },
    ...txExpand,
    ...blockExpand,
  } satisfies Prisma.BlobsOnTransactionsSelect;
}
