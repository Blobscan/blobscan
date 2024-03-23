import { Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import {
  blockReferenceSelect,
  dataStorageReferencesSelect,
  transactionReferenceSelect,
} from "../../../utils";

export const baseBlobSelect = Prisma.validator<Prisma.BlobSelect>()({
  commitment: true,
  proof: true,
  size: true,
  versionedHash: true,
  dataStorageReferences: {
    select: dataStorageReferencesSelect,
  },
});

function createTransactionSelect(expands?: Expands) {
  return Prisma.validator<Prisma.TransactionSelect>()({
    ...(expands?.expandedTransactionSelect ?? {}),
    ...transactionReferenceSelect,
    rollup: true,
    block: {
      select: {
        ...(expands?.expandedBlockSelect ?? {}),
        ...blockReferenceSelect,
      },
    },
  });
}

export function createBlobSelect(expands?: Expands) {
  return Prisma.validator<Prisma.BlobSelect>()({
    ...baseBlobSelect,
    transactions: {
      select: {
        index: true,
        transaction: {
          select: createTransactionSelect(expands),
        },
      },
    },
  });
}

export function createBlobsOnTransactionsSelect(expands?: Expands) {
  return Prisma.validator<Prisma.BlobsOnTransactionsSelect>()({
    index: true,
    blob: {
      select: baseBlobSelect,
    },
    transaction: {
      select: createTransactionSelect(expands),
    },
  });
}
