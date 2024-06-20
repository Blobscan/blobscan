import type { BlobData, BlobDataStorageReference } from "@prisma/client";
import type { PrismaClient, Rollup } from "@prisma/client";

import POSTGRES_DATA from "./postgres/data.json";

export const fixtures = {
  blobStoragesState: POSTGRES_DATA.blobStoragesState,
  blockchainSyncState: POSTGRES_DATA.blockchainSyncState,
  blocks: POSTGRES_DATA.blocks,
  addresses: POSTGRES_DATA.addresses,
  txs: POSTGRES_DATA.txs.map((tx) => ({
    ...tx,
    rollup: tx.rollup as Rollup | null,
  })),
  txForks: POSTGRES_DATA.transactionForks,
  blobs: POSTGRES_DATA.blobs,
  blobDataStorageRefs:
    POSTGRES_DATA.blobDataStorageReferences as BlobDataStorageReference[],
  blobDatas: POSTGRES_DATA.blobDatas.map<BlobData>((blobData) => ({
    id: blobData.id,
    data: Buffer.from(blobData.data, "hex"),
  })),
  blobsOnTransactions: POSTGRES_DATA.blobsOnTransactions,
  systemDate: POSTGRES_DATA.systemDate,

  canonicalBlocks: POSTGRES_DATA.blocks.filter(
    (block) =>
      !POSTGRES_DATA.transactionForks.find(
        (fork) => fork.blockHash === block.hash
      )
  ),
  canonicalTxs: POSTGRES_DATA.txs.filter(
    (tx) =>
      !POSTGRES_DATA.transactionForks.find((fork) => fork.hash === tx.hash)
  ),
  canonicalBlobs: POSTGRES_DATA.blobsOnTransactions
    .filter(
      (bTx) =>
        !POSTGRES_DATA.transactionForks.find((fork) => fork.hash === bTx.txHash)
    )
    .map((bTx) => {
      const blob = POSTGRES_DATA.blobs.find(
        (blob) => blob.versionedHash === bTx.blobHash
      );

      if (!blob)
        throw new Error(
          `Failed to get fixture canonical blobs: Blob with id ${bTx.blobHash} not found`
        );

      return blob;
    }),
  canonicalUniqueBlobs: POSTGRES_DATA.blobs.filter((blob) => {
    const bTx = POSTGRES_DATA.blobsOnTransactions.find(
      (bTx) => bTx.blobHash === blob.versionedHash
    );

    return !POSTGRES_DATA.transactionForks.find(
      (fork) => fork.hash === bTx?.txHash
    );
  }),

  async create(prisma: PrismaClient) {
    await prisma.$transaction([
      prisma.blockchainSyncState.deleteMany(),
      prisma.blobStoragesState.deleteMany(),
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

      prisma.blobStoragesState.createMany({
        data: fixtures.blobStoragesState,
      }),
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
      prisma.transactionFork.createMany({
        data: this.txForks,
      }),
    ]);
  },
};
