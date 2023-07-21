import { Prisma } from "@blobscan/db";

export const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
  versionedHash: true,
  commitment: true,
  size: true,
  dataStorageReferences: {
    select: {
      dataUri: true,
      blobStorage: true,
    },
  },
  transactions: {
    select: {
      index: true,
      txHash: true,
      transaction: {
        select: {
          blockNumber: true,
          block: {
            select: {
              timestamp: true,
            },
          },
        },
      },
    },
  },
});

export const blobsOnTransactionsSelect =
  Prisma.validator<Prisma.BlobsOnTransactionsSelect>()({
    blobHash: true,
    txHash: true,
    index: true,
    blob: {
      select: {
        commitment: true,
        size: true,
        dataStorageReferences: {
          select: {
            blobStorage: true,
            dataUri: true,
          },
        },
      },
    },
    transaction: {
      select: {
        blockNumber: true,
        block: {
          select: {
            timestamp: true,
          },
        },
      },
    },
  });
