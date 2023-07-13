import { Prisma } from "@blobscan/db";

export const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
  id: false,
  versionedHash: true,
  commitment: true,
  gsUri: true,
  swarmHash: true,
  size: true,
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
        gsUri: true,
        swarmHash: true,
        size: true,
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
