import { Prisma } from "@blobscan/db";

export const dataStorageReferencesSelect =
  Prisma.validator<Prisma.BlobDataStorageReferenceSelect>()({
    blobStorage: true,
    dataReference: true,
  });

export const blockReferenceSelect = Prisma.validator<Prisma.BlockSelect>()({
  number: true,
});

export const blobReferenceSelect = Prisma.validator<Prisma.BlobSelect>()({
  versionedHash: true,
});

export const blobsOnTransactionsReferencesSelect =
  Prisma.validator<Prisma.BlobsOnTransactionsSelect>()({
    index: true,
    blob: {
      select: blobReferenceSelect,
    },
  });
