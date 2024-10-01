import { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import { dataStorageReferencesSelect } from "../../../utils";

export const baseBlobSelect = Prisma.validator<Prisma.BlobSelect>()({
  commitment: true,
  proof: true,
  size: true,
  versionedHash: true,
  dataStorageReferences: {
    select: dataStorageReferencesSelect,
  },
});

export function createBlobSelect(expands: Expands) {
  return Prisma.validator<Prisma.BlobSelect>()({
    ...baseBlobSelect,
    transactions: {
      select: {
        blockHash: true,
        blockNumber: true,
        blockTimestamp: true,
        index: true,
        txHash: true,
        txIndex: true,
        category: true,
        rollup: true,
        ...(expands.transaction
          ? {
              transaction: expands.transaction,
            }
          : {}),

        ...(expands.block
          ? {
              block: expands.block,
            }
          : {}),
      },
    },
  });
}

export function createBlobsOnTransactionsSelect(expands: Expands) {
  return Prisma.validator<Prisma.BlobsOnTransactionsSelect>()({
    index: true,
    blobHash: true,
    blockHash: true,
    blockNumber: true,
    blockTimestamp: true,
    txHash: true,
    txIndex: true,
    category: true,
    rollup: true,
    blob: {
      select: baseBlobSelect,
    },
    ...(expands.block ? { block: expands.block } : {}),
    ...(expands.transaction ? { transaction: expands.transaction } : {}),
  });
}
