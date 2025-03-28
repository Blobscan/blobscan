import type {
  PrismaClient,
  BlobData,
  BlobDataStorageReference,
  Category,
  Rollup,
  AddressCategoryInfo,
} from "@prisma/client";

import type { DatePeriodLike } from "@blobscan/dayjs";
import dayjs, { MIN_DATE, toDailyDatePeriod } from "@blobscan/dayjs";

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
  const dbAddresses: Omit<AddressCategoryInfo, "id">[] = [];

  txs.forEach((tx) => {
    const from = dbAddresses.find(
      (a) => a.address === tx.fromId && a.category === tx.category
    );
    const to = dbAddresses.find(
      (a) => a.address === tx.toId && a.category === tx.category
    );
    const fromAllTime = dbAddresses.find(
      (a) => a.address === tx.fromId && a.category === null
    );
    const toAllTime = dbAddresses.find(
      (a) => a.address === tx.toId && a.category === null
    );

    if (!fromAllTime) {
      dbAddresses.push({
        address: tx.fromId,
        category: null,
        firstBlockNumberAsSender: tx.blockNumber,
        firstBlockNumberAsReceiver: null,
      });
    } else {
      fromAllTime.firstBlockNumberAsSender =
        fromAllTime.firstBlockNumberAsSender
          ? Math.min(fromAllTime.firstBlockNumberAsSender, tx.blockNumber)
          : tx.blockNumber;
    }

    if (!toAllTime) {
      dbAddresses.push({
        address: tx.toId,
        category: null,
        firstBlockNumberAsSender: null,
        firstBlockNumberAsReceiver: tx.blockNumber,
      });
    } else {
      toAllTime.firstBlockNumberAsReceiver =
        toAllTime.firstBlockNumberAsReceiver
          ? Math.min(toAllTime.firstBlockNumberAsReceiver, tx.blockNumber)
          : tx.blockNumber;
    }

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

  getBlocks({ blockNumberRange, datePeriod }: GetOptions) {
    if (!datePeriod && !blockNumberRange) return fixtures.canonicalBlocks;

    const { from = MIN_DATE, to = new Date() } = datePeriod
      ? toDailyDatePeriod(datePeriod)
      : {};
    const fromBlock = blockNumberRange?.from ?? 0;
    const toBlock = blockNumberRange?.to ?? Number.MAX_SAFE_INTEGER;

    return fixtures.canonicalBlocks.filter((b) => {
      const isInDateRange = dayjs(b.timestamp).isBetween(from, to);
      const isInBlockNumberRange = b.number >= fromBlock && b.number <= toBlock;

      return isInDateRange && isInBlockNumberRange;
    });
  },

  getTransactions(opts: GetOptions) {
    const { category, rollup } = opts || {};

    const dailyBlocks = this.getBlocks(opts);

    return fixtures.txs
      .filter((tx) => {
        const isDailyBlockTx = dailyBlocks.find(
          (block) => block.hash === tx.blockHash
        );
        const hasCategory = category ? tx.category === category : true;
        const hasRollup = rollup ? tx.rollup === rollup : true;

        return isDailyBlockTx && hasCategory && hasRollup;
      })
      .map((tx) => {
        const block = dailyBlocks.find((b) => b.hash === tx.blockHash);
        const fromHistory = fixtures.addressesHistory.find(
          (a) => a.address === tx.fromId && a.category === tx.category
        );
        const toHistory = fixtures.addressesHistory.find(
          (a) => a.address === tx.toId && a.category === tx.category
        );
        const blobs = fixtures.blobsOnTransactions
          .filter((btx) => btx.txHash === tx.hash)
          .map((btx) =>
            fixtures.blobs.find((b) => b.versionedHash === btx.blobHash)
          )
          .filter((b): b is (typeof fixtures)["blobs"][number] => !!b);

        if (!block)
          throw new Error(`Block with hash "${tx.blockHash}" not found`);
        if (!fromHistory)
          throw new Error(
            `From Address history with id "${tx.fromId}-${tx.category}" not found`
          );
        if (!toHistory)
          throw new Error(
            `To Address history with id "${tx.toId}-${tx.category}" not found`
          );

        return {
          ...tx,
          block,
          blobs,
          fromHistory,
          toHistory,
        };
      });
  },

  getBlobs(opts: GetOptions) {
    const dailyBlockTxs = this.getTransactions(opts);

    return fixtures.blobsOnTransactions
      .filter((btx) => dailyBlockTxs.find((tx) => tx.hash === btx.txHash))
      .map((btx) => {
        const block = fixtures.canonicalBlocks.find(
          (b) => b.hash === btx.blockHash
        );
        const transaction = fixtures.txs.find((tx) => tx.hash === btx.txHash);
        const blob = fixtures.blobs.find(
          (blob) => blob.versionedHash === btx.blobHash
        );

        if (!blob) throw new Error(`Blob with id ${btx.blobHash} not found`);
        if (!block)
          throw new Error(`Block with hash ${btx.blockHash} not found`);
        if (!transaction)
          throw new Error(`Transaction with hash ${btx.txHash} not found`);

        return {
          ...blob,
          category: transaction.category,
          rollup: transaction.rollup,
          transaction,
          block,
        };
      });
  },

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
      prisma.addressCategoryInfo.deleteMany(),
      prisma.address.deleteMany(),
      prisma.addressCategoryInfo.deleteMany(),
      prisma.block.deleteMany(),
      prisma.dailyStats.deleteMany(),
      prisma.overallStats.deleteMany(),

      prisma.ethUsdPrice.deleteMany(),
      prisma.ethUsdPriceFeedState.deleteMany(),

      prisma.blobStoragesState.createMany({
        data: fixtures.blobStoragesState,
      }),
      prisma.blockchainSyncState.createMany({
        data: fixtures.blockchainSyncState,
      }),
      prisma.block.createMany({ data: fixtures.blocks }),
      prisma.address.createMany({ data: fixtures.addresses }),
      prisma.addressCategoryInfo.createMany({
        data: fixtures.addressesHistory,
      }),
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
