import type { Address, Blob, BlobData, Block, Prisma } from "@prisma/client";
import ora from "ora";

import dayjs from "@blobscan/dayjs";

import { getPrisma } from "..";
import type { WithoutTimestampFields } from "../types";
import { DataGenerator } from "./DataGenerator";
import { mainnetRollupRegistry } from "./chain";
import { seedParams } from "./params";
import { performPrismaUpsertManyInBatches } from "./utils";

const prisma = getPrisma();
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
      const addressToAddressEntity: Record<
        string,
        WithoutTimestampFields<Address>
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

          const fromAddress = addressToAddressEntity[tx.fromId] ?? {
            address: tx.fromId,
            rollup: mainnetRollupRegistry.getRollup(tx.fromId),
            firstBlockNumberAsSender: null,
            firstBlockNumberAsReceiver: null,
          };
          const toAddress = addressToAddressEntity[tx.toId] ?? {
            address: tx.toId,
            rollup: mainnetRollupRegistry.getRollup(tx.toId),
            firstBlockNumberAsSender: null,
            firstBlockNumberAsReceiver: null,
          };

          fromAddress.firstBlockNumberAsSender = Math.min(
            fromAddress.firstBlockNumberAsSender ?? tx.blockNumber,
            tx.blockNumber
          );
          toAddress.firstBlockNumberAsReceiver = Math.min(
            toAddress.firstBlockNumberAsReceiver ?? tx.blockNumber,
            tx.blockNumber
          );

          addressToAddressEntity[fromAddress.address] = fromAddress;
          addressToAddressEntity[toAddress.address] = toAddress;

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
        Object.values(addressToAddressEntity),
        prisma.address.upsertMany
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
    spinner = spinner.fail(`Error seeding db`);

    console.error(e);

    await prisma.$disconnect();
    process.exit(1);
  });
