import type { BlobStorage } from "@prisma/client";

import { getPrisma } from "../services/prisma";
import data from "./postgres/data.json";

const prisma = getPrisma();

type BlobDataStorageReferenceFixture = {
  blobHash: string;
  blobStorage: BlobStorage;
  dataReference: string;
};

type BlobDataFixture = {
  id: string;
  data: Buffer;
};

export const fixtures = {
  blockchainSyncState: data.blockchainSyncState,
  blocks: data.blocks,
  addresses: data.addresses,
  txs: data.txs,
  blobs: data.blobs,
  blobDataStorageRefs:
    data.blobDataStorageReferences as BlobDataStorageReferenceFixture[],
  blobDatas: data.blobDatas as unknown as BlobDataFixture[],
  blobsOnTransactions: data.blobsOnTransactions,
  systemDate: data.systemDate,
};

export function loadFixtures() {
  return prisma.$transaction([
    prisma.blockchainSyncState.createMany({
      data: fixtures.blockchainSyncState,
    }),
    prisma.block.createMany({ data: fixtures.blocks }),
    prisma.address.createMany({ data: fixtures.addresses }),
    prisma.transaction.createMany({ data: fixtures.txs }),
    prisma.blob.createMany({ data: fixtures.blobs }),
    prisma.blobDataStorageReference.createMany({
      data: fixtures.blobDataStorageRefs,
    }),
    prisma.blobData.createMany({ data: fixtures.blobDatas }),
    prisma.blobsOnTransactions.createMany({
      data: fixtures.blobsOnTransactions,
    }),
  ]);
}

export function resetFixtures() {
  return prisma.$transaction([
    prisma.blockchainSyncState.deleteMany(),
    prisma.blobDailyStats.deleteMany(),
    prisma.blockDailyStats.deleteMany(),
    prisma.transactionDailyStats.deleteMany(),
    prisma.blobOverallStats.deleteMany(),
    prisma.blockOverallStats.deleteMany(),
    prisma.transactionOverallStats.deleteMany(),
    prisma.blobData.deleteMany(),
    prisma.blobsOnTransactions.deleteMany(),
    prisma.blobDataStorageReference.deleteMany(),
    prisma.blob.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.address.deleteMany(),
    prisma.block.deleteMany(),
  ]);
}
