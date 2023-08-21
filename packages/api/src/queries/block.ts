import { Prisma } from "@blobscan/db";

const blockSelect = Prisma.validator<Prisma.BlockSelect>()({
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  excessBlobGas: true,
});

export const fullBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  ...blockSelect,
  transactions: {
    select: {
      hash: true,
      fromId: true,
      toId: true,
      blobs: {
        select: {
          blobHash: true,
          index: true,
          blob: {
            select: {
              size: true,
            },
          },
        },
      },
    },
  },
});
