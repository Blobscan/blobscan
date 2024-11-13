import type { AddressCategoryInfo, Blob, Block, Prisma } from "@prisma/client";

import dayjs from "@blobscan/dayjs";

import { prisma } from "..";
import { DataGenerator } from "./DataGenerator";
import { seedParams } from "./params";
import { performPrismaUpsertManyInBatches } from "./utils";

async function main() {
  const dataGenerator = new DataGenerator(seedParams);
  const addresses = dataGenerator.generateAddresses();
  let lastBlock: Block | undefined;
  const blobs: Blob[] = [];
  for (let i = seedParams.totalDays; i > 0; i--) {
    const fullBlocks = dataGenerator.generateDBFullBlocks({
      initialBlock: lastBlock,
      uniqueAddresses: addresses,
      prevBlobs: blobs,
    });
    const { blocks: forkBlocks, txs: forkTxs } =
      dataGenerator.generateDBTransactionForks(fullBlocks);
    const addressToCategoryInfo: Record<
      string,
      Omit<AddressCategoryInfo, "id">
    > = {};
    const dbBlockInsertions: Prisma.BlockCreateManyInput[] = [];
    const dbTxInsertions: Prisma.TransactionCreateManyInput[] = [];
    const dbBlobInsertions: Blob[] = [];
    const dbBlobsOnTxsInsertions: Prisma.BlobsOnTransactionsCreateManyInput[] =
      [];
    const dbBlobDataStorageRefs: Prisma.BlobDataStorageReferenceCreateManyInput[] =
      [];

    fullBlocks.forEach(({ transactions, ...block }) => {
      dbBlockInsertions.push(block);
      transactions.forEach(({ blobs, ...tx }) => {
        dbTxInsertions.push({
          ...tx,
          decodedFields: undefined,
        });

        const from = addressToCategoryInfo[tx.fromId];
        const to = addressToCategoryInfo[tx.toId];
        if (from) {
          from.firstBlockNumberAsSender = Math.min(
            from.firstBlockNumberAsSender ?? tx.blockNumber,
            tx.blockNumber
          );
        } else {
          addressToCategoryInfo[tx.fromId] = {
            address: tx.fromId,
            firstBlockNumberAsReceiver: null,
            firstBlockNumberAsSender: tx.blockNumber,
            category: tx.category,
          };
        }
        if (to) {
          to.firstBlockNumberAsReceiver = Math.min(
            to.firstBlockNumberAsReceiver ?? tx.blockNumber,
            tx.blockNumber
          );
        } else {
          addressToCategoryInfo[tx.toId] = {
            address: tx.toId,
            firstBlockNumberAsReceiver: tx.blockNumber,
            firstBlockNumberAsSender: null,
            category: tx.category,
          };
        }
        blobs.forEach(({ storageRefs, ...blob }, i) => {
          dbBlobInsertions.push(blob);
          dbBlobsOnTxsInsertions.push({
            blobHash: blob.versionedHash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            blockTimestamp: tx.blockTimestamp,
            index: i,
            txHash: tx.hash,
            txIndex: tx.index as number,
          });
          storageRefs.forEach((storageRef) => {
            dbBlobDataStorageRefs.push(storageRef);
          });
        });
      });
    });
    console.log(
      `Day ${i} of ${seedParams.totalDays} generated (blocks: ${
        fullBlocks.length
      }, txs: ${dbTxInsertions.length}, blobs: ${
        dbBlobInsertions.length
      }, addresses: ${Object.keys(addressToCategoryInfo).length})`
    );
    // await performPrismaOpInBatches(dbBlockInsertions, prisma.block.createMany);
    const blockPerformance = performance.now();
    await prisma.block.createMany({
      data: dbBlockInsertions,
    });
    const blockPerformanceEnd = performance.now();
    const addressPerformance = performance.now();
    await performPrismaUpsertManyInBatches(
      Object.values(addressToCategoryInfo).map((addressCategoryInfo) => ({
        address: addressCategoryInfo.address,
      })),
      prisma.address.upsertMany
    );
    const addressPerformanceEnd = performance.now();

    const addressCategoryInfoPerformanceStart = performance.now();
    await performPrismaUpsertManyInBatches(
      Object.values(addressToCategoryInfo),
      prisma.addressCategoryInfo.upsertMany
    );
    const addressCategoryInfoPerformanceEnd = performance.now();

    const txPerformance = performance.now();
    await prisma.transaction.createMany({
      data: dbTxInsertions,
    });
    const txPerformanceEnd = performance.now();
    const blobsPerformance = performance.now();
    await prisma.blob.createMany({
      data: dbBlobInsertions,
      skipDuplicates: true,
    });
    const blobsPerformanceEnd = performance.now();
    const blobsOnTxsPerformance = performance.now();
    await prisma.blobsOnTransactions.createMany({
      data: dbBlobsOnTxsInsertions,
      skipDuplicates: true,
    });
    const blobsOnTxsPerformanceEnd = performance.now();
    const blobStoragePerformance = performance.now();
    await prisma.blobDataStorageReference.createMany({
      data: dbBlobDataStorageRefs,
      skipDuplicates: true,
    });
    const blobStoragePerformanceEnd = performance.now();

    // Generate forks
    await prisma.$transaction([
      prisma.block.createMany({
        data: forkBlocks,
      }),
      prisma.transactionFork.createMany({
        data: forkTxs,
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { transactions: _, ...block } = fullBlocks[fullBlocks.length - 1]!;
    lastBlock = block;
    console.log(
      `Day ${i} of ${seedParams.totalDays} inserted. Times: blocks: ${
        (blockPerformanceEnd - blockPerformance) / 1000
      }, addresses: ${
        (addressPerformanceEnd - addressPerformance) / 1000
      }, txs: ${(txPerformanceEnd - txPerformance) / 1000},
      addressCategoryInfo: ${
        (addressCategoryInfoPerformanceEnd -
          addressCategoryInfoPerformanceStart) /
        1000
      },
      blobs: ${(blobsPerformanceEnd - blobsPerformance) / 1000}, blobsOnTxs: ${
        (blobsOnTxsPerformanceEnd - blobsOnTxsPerformance) / 1000
      }, blobStorage: ${
        (blobStoragePerformanceEnd - blobStoragePerformance) / 1000
      }`
    );
    console.log(
      "========================================================================"
    );
  }

  const overallPerformance = performance.now();

  await prisma.overallStats.aggregate();

  const overallPerformanceEnd = performance.now();
  console.log(
    `Overall stats created. Time: ${
      (overallPerformanceEnd - overallPerformance) / 1000
    }`
  );
  const dailyStatsPerformance = performance.now();
  const yesterdayPeriod = {
    to: dayjs().subtract(1, "day").startOf("day").toISOString(),
  };

  await prisma.dailyStats.aggregate(yesterdayPeriod);

  const dailyStatsPerformanceEnd = performance.now();
  console.log(
    `Daily stats created. Time: ${
      (dailyStatsPerformanceEnd - dailyStatsPerformance) / 1000
    }`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
