import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import { sha256 } from "js-sha256";

const prisma = new PrismaClient();

const TOTAL_DAYS = 30;
const MIN_BLOCKS_PER_DAY = 100;
const MAX_BLOCKS_PER_DAY = 500;

const MAX_BLOBS_PER_BLOCK = 6;
const MAX_BLOBS_PER_TX = 2;
const BLOBS_AMOUNT = 250;
// const BLOB_SIZE = 131_072;
const BLOB_SIZE = 2500;

function generateTimestamps(
  days: number,
  minTimestamps: number,
  maxTimestamps: number,
) {
  const resultTimestamps: Date[] = [];

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
        faker.date.between({ from: startDay.toDate(), to: endDay.toDate() }),
      );
    }

    resultTimestamps.push(...Array.from(timestamps).sort());

    startDay = startDay.add(1, "day");
  });

  return resultTimestamps;
}

function generateBlobs(
  size: number,
): { versionedHash: string; commitment: string; data: string }[] {
  return Array.from({ length: size }).map(() => {
    const commitment = faker.string.hexadecimal({
      length: 96,
    });
    const versionedHash = `0x01${sha256(commitment).slice(2)}`;

    return {
      versionedHash,
      commitment,
      data: faker.string.hexadecimal({ length: BLOB_SIZE }),
    };
  });
}

async function main() {
  const timestamps = generateTimestamps(
    TOTAL_DAYS,
    MIN_BLOCKS_PER_DAY,
    MAX_BLOCKS_PER_DAY,
  );
  const blobs = generateBlobs(BLOBS_AMOUNT);

  let prevBlockNumber = 0;
  let prevSlot = 0;
  const blocks = timestamps.map((timestamp) => {
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
    };
  });

  const blocksTxs = blocks.map((block) => {
    const txCount = faker.number.int({ min: 1, max: MAX_BLOBS_PER_BLOCK });

    return Array.from({ length: txCount }).map(() => {
      const txHash = faker.string.hexadecimal({ length: 64 });
      return {
        id: txHash,
        hash: txHash,
        from: faker.finance.ethereumAddress(),
        to: faker.finance.ethereumAddress(),
        blockNumber: block.number,
        timestamp: block.timestamp,
      };
    });
  });

  const txsBlobs = blocksTxs.map((blockTxs) => {
    let blockBlobsRemaining = Math.min(
      MAX_BLOBS_PER_TX * blockTxs.length,
      MAX_BLOBS_PER_BLOCK,
    );

    return blockTxs
      .map((blockTx, blockTxIndex) => {
        const blockTxsRemaining = blockTxs.length - blockTxIndex + 1;

        const txBlobsCount = faker.number.int({
          min: 1,
          max: blockTxsRemaining === blockBlobsRemaining ? 1 : MAX_BLOBS_PER_TX,
        });

        blockBlobsRemaining -= txBlobsCount;

        return Array.from({ length: txBlobsCount }).map((_, txBlobIndex) => {
          const blobIndex = faker.number.int(blobs.length - 1);
          const blob = blobs[blobIndex];

          // Unreachable code, done only for type checking
          if (!blob) {
            throw new Error(
              `Index mismatch. Blob not found for index ${blobIndex}`,
            );
          }

          return {
            ...blob,
            txHash: blockTx.hash,
            index: txBlobIndex,
            timestamp: blockTx.timestamp,
          };
        });
      })
      .flat();
  });

  const blocksResult = await prisma.block.createMany({
    data: blocks,
    skipDuplicates: true,
  });

  const txsResult = await prisma.transaction.createMany({
    data: blocksTxs.flat(),
  });

  const blobsResult = await prisma.blob.createMany({
    data: txsBlobs.flat(),
  });

  console.log(
    "========================================================================",
  );
  console.log(`Data inserted for the last ${TOTAL_DAYS} days`);
  console.log(`Blocks inserted: ${blocksResult.count}`);
  console.log(`Transactions inserted: ${txsResult.count}`);
  console.log(`Blobs inserted: ${blobsResult.count}`);
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
