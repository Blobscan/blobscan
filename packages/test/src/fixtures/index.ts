import type {
  PrismaClient,
  BlobData,
  BlobDataStorageReference,
  Category,
  Rollup,
  AddressHistory,
} from "@prisma/client";

import type { DatePeriodLike } from "@blobscan/dayjs";

import POSTGRES_DATA from "./postgres/data.json";

export type GetOptions = {
  blockNumberRange?: { from?: number; to?: number };
  datePeriod?: DatePeriodLike;
  category?: Category | null;
  rollup?: Rollup | null;
};

function getDBAddresses(txs: typeof POSTGRES_DATA.txs) {
  return Array.from(
    new Set<string>(txs.flatMap((tx) => [tx.fromId, tx.toId]))
  ).map((addr) => ({
    address: addr,
  }));
}

function getDBAddressesHistory(txs: typeof POSTGRES_DATA.txs) {
  const dbAddresses: AddressHistory[] = [];

  txs.forEach((tx) => {
    const from = dbAddresses.find(
      (a) => a.address === tx.fromId && a.category === tx.category
    );
    const to = dbAddresses.find(
      (a) => a.address === tx.toId && a.category === tx.category
    );

    if (!from) {
      dbAddresses.push({
        address: tx.fromId,
        category: tx.category as Category,
        firstBlockNumberAsSender: tx.blockNumber,
        firstBlockNumberAsReceiver: null,
      });
    } else {
      from.firstBlockNumberAsSender = from.firstBlockNumberAsSender
        ? Math.min(from.firstBlockNumberAsSender, tx.blockNumber)
        : tx.blockNumber;
    }

    if (!to) {
      dbAddresses.push({
        address: tx.toId,
        category: tx.category as Category,
        firstBlockNumberAsSender: null,
        firstBlockNumberAsReceiver: tx.blockNumber,
      });
    } else {
      to.firstBlockNumberAsReceiver = to.firstBlockNumberAsReceiver
        ? Math.min(to.firstBlockNumberAsReceiver, tx.blockNumber)
        : tx.blockNumber;
    }
  });

  return dbAddresses;
}

export const fixtures = {
  blobStoragesState: POSTGRES_DATA.blobStoragesState,
  blockchainSyncState: POSTGRES_DATA.blockchainSyncState,
  blocks: POSTGRES_DATA.blocks,
  addresses: getDBAddresses(POSTGRES_DATA.txs),
  addressesHistory: getDBAddressesHistory(POSTGRES_DATA.txs),
  txs: POSTGRES_DATA.txs.map((tx) => ({
    ...tx,
    category: tx.category as Category,
    rollup: tx.rollup as Rollup | null,
  })),
  txForks: POSTGRES_DATA.transactionForks,
  blobs: POSTGRES_DATA.blobs,
  blobDataStorageRefs:
    POSTGRES_DATA.blobDataStorageReferences as BlobDataStorageReference[],
  blobDatas: POSTGRES_DATA.blobDatas.map<BlobData>(({ data: rawData, id }) => ({
    id,
    data: Buffer.from(rawData, "hex"),
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
      prisma.addressHistory.deleteMany(),
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
      prisma.addressHistory.createMany({ data: fixtures.addressesHistory }),
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
