import { Prisma } from "@blobscan/db";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  hash: true,
  fromId: true,
  toId: true,
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
