import { Prisma } from "@blobscan/db";

export const blobSelect = Prisma.validator<Prisma.BlobSelect>()({
  versionedHash: true,
  commitment: true,
  size: true,
});

export const fullBlobSelect = Prisma.validator<Prisma.BlobSelect>()({
  versionedHash: true,
  commitment: true,
  size: true,
  dataStorageReferences: {
    select: {
      blobStorage: true,
      dataReference: true,
    },
  },
  firstBlock: {
    select: {
      number: true,
      timestamp: true,
    },
  },
});
