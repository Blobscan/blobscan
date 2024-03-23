import {
  BlobData,
  type BlobStorage,
  type PrismaClient,
  type Rollup,
} from "@prisma/client";

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
  blobDatas: POSTGRES_DATA.blobDatas.map<BlobData>((blobData) => ({
    id: blobData.id,
    data: Buffer.from(blobData.data, "hex"),
  })),
  googleBlobData: [
    {
      versionedHash: "blobHash001",
      data: "0x0e2e5a3a2011ad49f5055eb3227d66d5",
    },
    {
      versionedHash: "blobHash002",
      data: "0x1ad6f58b3af99d6f7f70adcee71a1813",
    },
    {
      versionedHash: "blobHash003",
      data: "0x2142337a5355685b119880ba35efdd6b",
    },
    {
      versionedHash: "blobHash004",
      data: "0x4fe40fc67f9c3a3ffa2be77d10fe7818",
    },
  ],
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
