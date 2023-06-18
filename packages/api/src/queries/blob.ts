import { Prisma } from "@blobscan/db";

export const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
  id: false,
  versionedHash: true,
  index: true,
  commitment: true,
  data: true,
  txHash: true,
  transaction: {
    select: {
      block: {
        select: {
          number: true,
          timestamp: true,
        },
      },
    },
  },
});
