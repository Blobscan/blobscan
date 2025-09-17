import type { Prisma } from "@prisma/client";

import type { BlobscanPrismaClient } from ".";

export type ExtendedTransactionSelect = NonNullable<
  Prisma.Args<BlobscanPrismaClient["transaction"], "findFirstOrThrow">["select"]
>;

export type ExtendedBlockSelect = NonNullable<
  Prisma.Args<BlobscanPrismaClient["block"], "findFirst">["select"]
>;

export type ExtendedEthUsdPriceSelect = NonNullable<
  Prisma.Args<BlobscanPrismaClient["ethUsdPrice"], "findFirstOrThrow">["select"]
>;

export type ExtendedBlobDataStorageReferenceSelect = NonNullable<
  Prisma.Args<
    BlobscanPrismaClient["blobDataStorageReference"],
    "findFirstOrThrow"
  >["select"]
>;
