import { Prisma } from "@blobscan/db";

const blockSelect = Prisma.validator<Prisma.BlockSelect>()({
  id: false,
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
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
        },
      },
    },
  },
});
