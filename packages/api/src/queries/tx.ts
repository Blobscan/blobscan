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
        blobHash: true,
        index: true,
        blob: {
          select: {
            commitment: true,
            gsUri: true,
            swarmHash: true,
            size: true,
          },
        },
      },
    },
  });
