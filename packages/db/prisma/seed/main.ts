import type {
  AddressCategoryInfo,
  Blob,
  BlobData,
  Block,
  Prisma,
} from "@prisma/client";
import ora from "ora";

import dayjs from "@blobscan/dayjs";

import { prisma } from "..";
import type { Rollup } from "../enums";
import { DataGenerator } from "./DataGenerator";
import { seedParams } from "./params";
import { performPrismaUpsertManyInBatches } from "./utils";
import { ROLLUP_ADDRESSES } from "./web3";

let spinner = ora("Seeding database…").start();

async function measureExecutionTime(fn: () => Promise<void> | void) {
  const start = performance.now();
  await fn();
  const end = performance.now();

  return ((end - start) / 1000).toFixed(2);
}

async function main() {
  const dataGenerator = new DataGenerator(seedParams);
  const addresses = dataGenerator.generateAddresses();
  let lastBlock: Block | undefined;
  const blobs: Blob[] = [];
  let totalBlocks = 0,
    totalTxs = 0,
    totalBlobs = 0,
    totalBlobsOnTxs = 0,
    totalForkTxs = 0;

  spinner = spinner.info(`Generating data for ${seedParams.totalDays} days…`);

  const dbInsertionExecutionTime = await measureExecutionTime(async () => {
    for (let i = seedParams.totalDays; i > 0; i--) {
      const prefix = `Day ${i}:`;

      spinner = spinner.start(`${prefix} Generating data…`);

      const fullBlocks = dataGenerator.generateDBFullBlocks({
        initialBlock: lastBlock,
        uniqueAddresses: addresses,
        prevBlobs: blobs,
      });
      const { blocks: forkBlocks, txs: forkTxs } =
        dataGenerator.generateDBTransactionForks(fullBlocks);
      const addressToCategoryInfo: Record<
        string,
        Omit<AddressCategoryInfo, "id">[]
      > = {};
      const dbBlockInsertions: Prisma.BlockCreateManyInput[] = [];
      const dbTxInsertions: Prisma.TransactionCreateManyInput[] = [];
      const dbBlobInsertions: Blob[] = [];
      const dbBlobsOnTxsInsertions: Prisma.BlobsOnTransactionsCreateManyInput[] =
        [];
      const dbBlobDataStorageRefs: Prisma.BlobDataStorageReferenceCreateManyInput[] =
        [];
      const dbBlobData: BlobData[] = [];

      spinner = spinner.start(`${prefix} Creating db entities…`);

      fullBlocks.forEach(({ transactions, ...block }) => {
        dbBlockInsertions.push(block);
        transactions.forEach(({ blobs, ...tx }) => {
          dbTxInsertions.push({
            ...tx,
            decodedFields: undefined,
          });

          const fromCategoryInfos = addressToCategoryInfo[tx.fromId];
          const toCategoryInfos = addressToCategoryInfo[tx.toId];
          const fromCategoryInfo = fromCategoryInfos?.find(
            (aci) => aci.category === tx.category
          );
          const toCategoryInfo = toCategoryInfos?.find(
            (aci) => aci.category === tx.category
          );

          if (fromCategoryInfo) {
            fromCategoryInfo.firstBlockNumberAsSender = Math.min(
              fromCategoryInfo.firstBlockNumberAsSender ?? tx.blockNumber,
              tx.blockNumber
            );
          } else {
            const newCategoryInfo = {
              address: tx.fromId,
              firstBlockNumberAsReceiver: null,
              firstBlockNumberAsSender: tx.blockNumber,
              category: tx.category,
            };

            if (fromCategoryInfos) {
              fromCategoryInfos.push(newCategoryInfo);
            } else {
              addressToCategoryInfo[tx.fromId] = [newCategoryInfo];
            }
          }

          if (toCategoryInfo) {
            toCategoryInfo.firstBlockNumberAsReceiver = Math.min(
              toCategoryInfo.firstBlockNumberAsReceiver ?? tx.blockNumber,
              tx.blockNumber
            );
          } else {
            const newCategoryInfo = {
              address: tx.toId,
              firstBlockNumberAsReceiver: tx.blockNumber,
              firstBlockNumberAsSender: null,
              category: tx.category,
            };

            if (toCategoryInfos) {
              toCategoryInfos.push(newCategoryInfo);
            } else {
              addressToCategoryInfo[tx.toId] = [newCategoryInfo];
            }
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
            dbBlobData.push({
              data: dataGenerator.generateBlobData(20),
              id: blob.versionedHash,
            });
          });
        });
      });

      await prisma.block.createMany({
        data: dbBlockInsertions,
      });
      await performPrismaUpsertManyInBatches(
        Object.keys(addressToCategoryInfo).map((address) => {
          const rollupEntry = Object.entries(ROLLUP_ADDRESSES).find(
            ([_, rollupAddress]) => address === rollupAddress
          );
          const rollup = rollupEntry ? (rollupEntry[0] as Rollup) : null;

          return {
            address,
            rollup,
          };
        }),
        prisma.address.upsertMany
      );
      await performPrismaUpsertManyInBatches(
        Object.values(addressToCategoryInfo).flatMap(
          (categoryInfos) => categoryInfos
        ),
        prisma.addressCategoryInfo.upsertMany
      );
      await prisma.transaction.createMany({
        data: dbTxInsertions,
      });
      await prisma.blob.createMany({
        data: dbBlobInsertions,
        skipDuplicates: true,
      });
      await prisma.blobsOnTransactions.createMany({
        data: dbBlobsOnTxsInsertions,
        skipDuplicates: true,
      });
      await prisma.blobDataStorageReference.createMany({
        data: dbBlobDataStorageRefs,
        skipDuplicates: true,
      });

      await prisma.blobData.createMany({
        data: dbBlobData,
        skipDuplicates: true,
      });

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

      spinner = spinner.start(`${prefix} Data inserted`);

      totalBlocks += dbBlockInsertions.length;
      totalTxs += dbTxInsertions.length;
      totalBlobs = dbBlobInsertions.length;
      totalBlobsOnTxs = dbBlobsOnTxsInsertions.length;
      totalForkTxs = forkTxs.length;
    }
  });

  spinner = spinner.info(
    `Data generated (${dbInsertionExecutionTime}s): ${totalBlocks} blocks, ${totalTxs} txs, ${totalBlobs} blobs, ${totalBlobsOnTxs} blobsOnTxs, ${totalForkTxs} fork txs`
  );

  spinner = spinner.start(`Aggregating stats…`);

  const statsExecutionTime = await measureExecutionTime(async () => {
    const yesterdayPeriod = {
      to: dayjs().subtract(1, "day").startOf("day").toISOString(),
    };

    spinner = spinner.start(`Aggregating stats…`);
    await Promise.all([
      prisma.dailyStats.aggregate(yesterdayPeriod),
      prisma.overallStats.aggregate(),
    ]);
  });

  spinner = spinner.info(`Stats aggregated (${statsExecutionTime}s)`);

  spinner = spinner.succeed("Database seeded!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    spinner = spinner.fail(`Error seeding db : ${e}`);

    await prisma.$disconnect();
    process.exit(1);
  });
