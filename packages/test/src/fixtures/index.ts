import type { BlobStorage, PrismaClient, Rollup } from "@prisma/client";

import POSTGRES_DATA from "./postgres/data.json";

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
  blockchainSyncState: POSTGRES_DATA.blockchainSyncState,
  blocks: POSTGRES_DATA.blocks,
  addresses: POSTGRES_DATA.addresses,
  txs: POSTGRES_DATA.txs.map((tx) => ({
    ...tx,
    rollup: tx.rollup as Rollup | null,
  })),
  blobs: POSTGRES_DATA.blobs,
  blobDataStorageRefs:
    POSTGRES_DATA.blobDataStorageReferences as BlobDataStorageReferenceFixture[],
  blobDatas: POSTGRES_DATA.blobDatas as unknown as BlobDataFixture[],
  blobsOnTransactions: POSTGRES_DATA.blobsOnTransactions,
  systemDate: POSTGRES_DATA.systemDate,

  async create(prisma: PrismaClient) {
    await prisma.$transaction([
      prisma.blockchainSyncState.deleteMany(),
      prisma.blobData.deleteMany(),
      prisma.blobsOnTransactions.deleteMany(),
      prisma.blobDataStorageReference.deleteMany(),
      prisma.blob.deleteMany(),
      prisma.transactionFork.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.address.deleteMany(),
      prisma.block.deleteMany(),
      prisma.blockDailyStats.deleteMany(),
      prisma.transactionDailyStats.deleteMany(),
      prisma.blobDailyStats.deleteMany(),
      prisma.blockOverallStats.deleteMany(),
      prisma.transactionOverallStats.deleteMany(),
      prisma.blobOverallStats.deleteMany(),
    ]);

    await prisma.$transaction([
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
  },
};
