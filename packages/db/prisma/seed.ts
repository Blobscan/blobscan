import { faker } from "@faker-js/faker";
import type { Address, Blob, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { sha256 } from "js-sha256";

import { blobStorageManager } from "@blobscan/blob-storage-manager";
import type { GoogleStorage } from "@blobscan/blob-storage-manager";
import dayjs from "@blobscan/dayjs";

import type { OmittableFields } from "./extensions";
import { baseExtension, statsExtension } from "./extensions";

const prisma = new PrismaClient()
  .$extends(baseExtension)
  .$extends(statsExtension);

const TOTAL_DAYS = 60;
const MIN_BLOCKS_PER_DAY = 500;
const MAX_BLOCKS_PER_DAY = 1000;

const MAX_BLOBS_PER_BLOCK = 6;
const MAX_BLOBS_PER_TX = 2;

const UNIQUE_BLOBS_AMOUNT = 100;
const UNIQUE_ADDRESSES_AMOUNT = 1000;

// const BLOB_SIZE = 131_072;
const MAX_BLOB_BYTES_SIZE = 1024; // in bytes

const BATCH_SIZE = 1000;
const STORAGE_BATCH_SIZE = 100;

type BlobWithData = Omit<Blob, OmittableFields> & { data: string };

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
    const dayTimestamps = faker.number.int({
      min: minTimestamps,
      max: maxTimestamps,
    });
    const timestamps = new Set<Date>();

    let previousTimestamp: dayjs.Dayjs = startDay;

    Array.from({ length: dayTimestamps }).forEach(() => {
      const blocksUntilNextTimestamp = faker.number.int({ min: 1, max: 3 });
      const blockValidationTime = faker.number.int({ min: 10, max: 15 });
      const timestamp = previousTimestamp.add(
        blocksUntilNextTimestamp * blockValidationTime,
        "second"
      );

      timestamps.add(timestamp.toDate());

      previousTimestamp = timestamp;
    });

    uniqueTimestamps.push(...Array.from(timestamps).sort());

    startDay = startDay.add(1, "day");
  });

  return uniqueTimestamps;
}

function generateUniqueBlobs(amount: number): BlobWithData[] {
  return Array.from({ length: amount }).map<BlobWithData>(() => {
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

function performPrismaOpInBatches<T>(
  elements: T[],
  prismaOp: ({ data }: { data: T[] }) => Promise<{ count: number }>
) {
  const batches = Math.ceil(elements.length / BATCH_SIZE);
  const operations: Promise<{ count: number }>[] = [];

  Array.from({ length: batches }).forEach((_, index) => {
    const start = index * BATCH_SIZE;
    const end = start + BATCH_SIZE;

    operations.push(prismaOp({ data: elements.slice(start, end) }));
  });

  return Promise.all(operations);
}

async function performBlobStorageOpInBatches(blobs: BlobWithData[]) {
  const batches = Math.ceil(blobs.length / STORAGE_BATCH_SIZE);
  const operations: Promise<Record<"google", string | undefined>[]>[] = [];

  Array.from({ length: batches }).forEach((_, index) => {
    const start = index * STORAGE_BATCH_SIZE;
    const end = start + STORAGE_BATCH_SIZE;

    operations.push(
      Promise.all(
        blobs.slice(start, end).map((b) => blobStorageManager.storeBlob(b))
      )
    );
  });

  for (const uploadBlobsPromise of operations) {
    await uploadBlobsPromise;
  }
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
        hash: txHash,
        fromId: from,
        toId: to,
        blockNumber: block.number,
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

  await performBlobStorageOpInBatches(blobs);

  const blobsUploadEnd = performance.now();

  const addressToAddressEntity = txs.reduce<Record<string, Address>>(
    (addressToTxData, tx) => {
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
    },
    {} as Record<string, Address>
  );
  const blobInputs = blobs.map<Blob>((b) => ({
    versionedHash: b.versionedHash,
    commitment: b.commitment,
    gsUri: b.gsUri,
    swarmHash: b.swarmHash,
    size: b.size,
    insertedAt: now,
    updatedAt: now,
  }));
  const addressInputs = Object.keys(addressToAddressEntity).map(
    (key) => addressToAddressEntity[key] as Address
  );

  const dataInsertionStart = performance.now();

  console.log(
    "========================================================================"
  );

  await performPrismaOpInBatches(addressInputs, prisma.address.createMany);
  console.log(`Addresses inserted: ${addressInputs.length}`);

  await performPrismaOpInBatches(blocks, prisma.block.createMany);
  console.log(`Blocks inserted: ${blocks.length}`);

  await performPrismaOpInBatches(txs, prisma.transaction.createMany);
  console.log(`Transactions inserted: ${txs.length}`);

  await performPrismaOpInBatches(blobInputs, prisma.blob.createMany);
  console.log(`Blobs inserted: ${blobInputs.length}`);

  await performPrismaOpInBatches(
    blobsOnTxs,
    prisma.blobsOnTransactions.createMany
  );
  console.log(`Blobs on transactions inserted: ${blobsOnTxs.length}`);

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

  console.log(`Data inserted for the last ${TOTAL_DAYS} days`);

  console.log(
    "========================================================================"
  );

  await Promise.all([
    prisma.blobOverallStats.backfill(),
    prisma.blockOverallStats.backfill(),
    prisma.transactionOverallStats.backfill(),
  ]);

  console.log("Overall stats created.");

  console.log(
    "========================================================================"
  );

  const yesterdayPeriod = {
    to: dayjs().subtract(1, "day").startOf("day").toISOString(),
  };

  await Promise.all([
    prisma.blobDailyStats.fill(yesterdayPeriod),
    prisma.blockDailyStats.fill(yesterdayPeriod),
    prisma.transactionDailyStats.fill(yesterdayPeriod),
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
