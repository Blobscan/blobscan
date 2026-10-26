import type { BlobscanPrismaClient } from ".";
import type { Prisma } from "./client/client";

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
