import { Prisma } from "@blobscan/db";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  id: false,
  hash: true,
  from: true,
  to: true,
  blockNumber: true,
});

export const fullTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    ...transactionSelect,
    block: {
      select: {
        timestamp: true,
      },
    },
    blobs: {
      select: {
        id: false,
        versionedHash: true,
        commitment: true,
        index: true,
      },
    },
  });
