import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { sha256 } from "js-sha256";

import { blobStorageManager } from "@blobscan/blob-storage-manager";
import type { GoogleStorage } from "@blobscan/blob-storage-manager";
import dayjs from "@blobscan/dayjs";

import { StatsAggregator } from "../StatsAggregator";
import { baseExtension } from "./extensions";

const prisma = new PrismaClient().$extends(baseExtension);
const statsAggregator = new StatsAggregator(prisma);

const TOTAL_DAYS = 365;
const MIN_BLOCKS_PER_DAY = 7199;
const MAX_BLOCKS_PER_DAY = 7200;

const MAX_BLOBS_PER_BLOCK = 6;
const MAX_BLOBS_PER_TX = 2;

const UNIQUE_BLOBS_AMOUNT = 5000;
const UNIQUE_ADDRESSES_AMOUNT = 100_000;

// const BLOB_SIZE = 131_072;
const MAX_BLOB_BYTES_SIZE = 1024; // in bytes

function buildGoogleStorageUri(hash: string): string {
  return `${process.env.CHAIN_ID}/${hash.slice(2, 4)}/${hash.slice(
    4,
    6
  )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
}

function generateUniqueTimestamps(
  days: number,
  minTimestamps: number,
  maxTimestamps: number
) {
  const uniqueTimestamps: Date[] = [];

  let startDay = dayjs().subtract(days, "day");

  Array.from({ length: days }).forEach(() => {
    const endDay = startDay.endOf("day");

    const dayTimestamps = faker.number.int({
      min: minTimestamps,
      max: maxTimestamps,
    });
    const timestamps = new Set<Date>();

    while (timestamps.size < dayTimestamps) {
      timestamps.add(
        faker.date.between({ from: startDay.toDate(), to: endDay.toDate() })
      );
    }

    uniqueTimestamps.push(...Array.from(timestamps).sort());

    startDay = startDay.add(1, "day");
  });

  return uniqueTimestamps;
}

type Blob = Prisma.BlobCreateManyInput & {
  data: string;
};

function generateUniqueBlobs(amount: number) {
  return Array.from({ length: amount }).map<
    Omit<Blob, "insertedAt" | "updatedAt">
  >(() => {
    const commitment = faker.string.hexadecimal({
      length: 96,
    });
    const versionedHash = `0x01${sha256(commitment).slice(2)}`;
    const dataLength = faker.number.int({
      min: MAX_BLOB_BYTES_SIZE,
      max: MAX_BLOB_BYTES_SIZE * 2,
    });
    const data = faker.string.hexadecimal({
      length: dataLength % 2 === 0 ? dataLength : dataLength + 1,
    });

    return {
      id: versionedHash,
      versionedHash,
      commitment,
      gsUri: buildGoogleStorageUri(versionedHash),
      swarmHash: sha256(data),
      size: data.slice(2).length / 2,
      data,
    };
  });
}

function generateUniqueAddresses(amount: number) {
  return Array.from({ length: amount }).map(() =>
    faker.finance.ethereumAddress()
  );
}

async function main() {
  const google = blobStorageManager.getStorage("google") as GoogleStorage;
  await google.setUpBucket();

  const timestamps = generateUniqueTimestamps(
    TOTAL_DAYS,
    MIN_BLOCKS_PER_DAY,
    MAX_BLOCKS_PER_DAY
  );
  const uniqueBlobs = generateUniqueBlobs(UNIQUE_BLOBS_AMOUNT);
  const uniqueAddresses = generateUniqueAddresses(UNIQUE_ADDRESSES_AMOUNT);

  let prevBlockNumber = 0;
  let prevSlot = 0;

  const dataGenerationStart = performance.now();
  const now = new Date();
  const blocks = timestamps.map<Prisma.BlockCreateManyInput>((timestamp) => {
    const number = prevBlockNumber + faker.number.int({ min: 1, max: 220 });
    const slot = prevSlot + faker.number.int({ min: 1, max: 200 });

    prevBlockNumber = number;
    prevSlot = slot;

    return {
      id: number,
      hash: faker.string.hexadecimal({ length: 64 }),
      number,
      timestamp,
      slot,
      insertedAt: now,
      updatedAt: now,
    };
  });

  const blocksTxs = blocks.map((block) => {
    const txCount = faker.number.int({ min: 1, max: MAX_BLOBS_PER_BLOCK });

    return Array.from({
      length: txCount,
    }).map<Prisma.TransactionCreateManyInput>(() => {
      const txHash = faker.string.hexadecimal({ length: 64 });
      const from =
        uniqueAddresses[faker.number.int(uniqueAddresses.length - 1)];
      const to = uniqueAddresses[faker.number.int(uniqueAddresses.length - 1)];

      // Unreachable code, done only for type checking
      if (!from || !to) throw new Error("Address not found");

      return {
        id: txHash,
        hash: txHash,
        fromId: from,
        toId: to,
        blockNumber: block.number,
        timestamp: block.timestamp,
        insertedAt: now,
        updatedAt: now,
      };
    });
  });

  const txsBlobs = blocksTxs.map((blockTxs) => {
    let blockBlobsRemaining = Math.min(
      MAX_BLOBS_PER_TX * blockTxs.length,
      MAX_BLOBS_PER_BLOCK
    );

    return blockTxs
      .map((blockTx, blockTxIndex) => {
        const blockTxsRemaining = blockTxs.length - blockTxIndex + 1;

        const txBlobsCount = faker.number.int({
          min: 1,
          max: blockTxsRemaining === blockBlobsRemaining ? 1 : MAX_BLOBS_PER_TX,
        });

        blockBlobsRemaining -= txBlobsCount;

        return Array.from({
          length: txBlobsCount,
        }).map<Prisma.BlobsOnTransactionsCreateManyInput>((_, txBlobIndex) => {
          const blobIndex = faker.number.int(uniqueBlobs.length - 1);
          const blob = uniqueBlobs[blobIndex];

          // Unreachable code, done only for type checking
          if (!blob) {
            throw new Error(
              `Index mismatch. Blob not found for index ${blobIndex}`
            );
          }

          return {
            blobHash: blob.versionedHash,
            txHash: blockTx.hash,
            index: txBlobIndex,
          };
        });
      })
      .flat();
  });

  const txs = blocksTxs.flat();
  const blobsOnTxs = txsBlobs.flat();
  const blobs = uniqueBlobs.filter((b) =>
    blobsOnTxs.some((bot) => bot.blobHash === b.versionedHash)
  );
  const dataGenerationEnd = performance.now();

  const blobsUploadStart = performance.now();
  const uploadBlobsPromise = uniqueBlobs.map(async (b) =>
    blobStorageManager.storeBlob(b)
  );
  await Promise.all(uploadBlobsPromise);
  const blobsUploadEnd = performance.now();

  const addressToAddressEntity = txs.reduce<
    Record<string, Prisma.AddressCreateManyInput>
  >((addressToTxData, tx) => {
    addressToTxData[tx.fromId] = {
      address: tx.fromId,
      isReceiver: false,
      ...addressToTxData[tx.fromId],
      isSender: true,
      insertedAt: now,
      updatedAt: now,
    };

    if (tx.toId) {
      addressToTxData[tx.toId] = {
        address: tx.toId,
        isSender: false,
        ...addressToTxData[tx.toId],
        isReceiver: true,
        insertedAt: now,
        updatedAt: now,
      };
    }

    return addressToTxData;
  }, {} as Record<string, Prisma.AddressCreateInput>);

  const dataInsertionStart = performance.now();
  const [addessesResult, blocksResult, txsResult, blobsResult] =
    await prisma.$transaction([
      prisma.address.createMany({
        data: Object.keys(addressToAddressEntity).map(
          (key) => addressToAddressEntity[key] as Prisma.AddressCreateInput
        ),
      }),
      prisma.block.createMany({
        data: blocks,
        skipDuplicates: true,
      }),
      prisma.transaction.createMany({
        data: txs,
      }),
      prisma.blob.createMany({
        data: blobs.map((b) => ({
          id: b.versionedHash,
          versionedHash: b.versionedHash,
          commitment: b.commitment,
          gsUri: b.gsUri,
          swarmHash: b.swarmHash,
          size: b.size,
          insertedAt: now,
          updatedAt: now,
        })),
      }),
      prisma.blobsOnTransactions.createMany({
        data: blobsOnTxs,
      }),
    ]);
  const dataInsertionEnd = performance.now();

  console.log(
    "========================================================================"
  );

  console.log(
    `Data generation took ${
      (dataGenerationEnd - dataGenerationStart) / 1000
    } seconds`
  );
  console.log(
    `Data insertion took ${
      (dataInsertionEnd - dataInsertionStart) / 1000
    } seconds`
  );
  console.log(
    `Blob upload took ${(blobsUploadEnd - blobsUploadStart) / 1000} seconds`
  );

  console.log(
    "========================================================================"
  );
  console.log(`Data inserted for the last ${TOTAL_DAYS} days`);
  console.log(`Addresses inserted: ${addessesResult.count}`);
  console.log(`Blocks inserted: ${blocksResult.count}`);
  console.log(`Transactions inserted: ${txsResult.count}`);
  console.log(`Blobs inserted: ${blobsResult.count}`);

  console.log(
    "========================================================================"
  );

  await statsAggregator.executeAllOverallStatsQueries(),
    console.log("Overall stats created.");

  console.log(
    "========================================================================"
  );

  const [dailyBlobStats, dailyBlockStats, dailyTransactionStats] =
    await statsAggregator.getAllDailyAggregates();
  await Promise.all([
    prisma.blobDailyStats.createMany({
      data: dailyBlobStats,
    }),
    prisma.blockDailyStats.createMany({
      data: dailyBlockStats,
    }),
    prisma.transactionDailyStats.createMany({
      data: dailyTransactionStats,
    }),
  ]);
  console.log("Daily stats created");

  console.log(
    "========================================================================"
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
