import { faker } from "@faker-js/faker";
import { Storage } from "@google-cloud/storage";
import { PrismaClient, type Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { sha256 } from "js-sha256";

import { StatsAggregator } from "../StatsAggregator";

const prisma = new PrismaClient();
const statsAggregator = new StatsAggregator(prisma);

const storage = new Storage({ apiEndpoint: "http://localhost:4443" });
const BUCKET_NAME = process.env.GOOGLE_STORAGE_BUCKET_NAME ?? "blobscan-dev";
const CHAIN_ID = process.env.CHAIN_ID ?? 100;

const TOTAL_DAYS = 30;
const MIN_BLOCKS_PER_DAY = 100;
const MAX_BLOCKS_PER_DAY = 500;

const MAX_BLOBS_PER_BLOCK = 6;
const MAX_BLOBS_PER_TX = 2;

const UNIQUE_BLOBS_AMOUNT = 250;
const UNIQUE_ADDRESSES_AMOUNT = 1000;

// const BLOB_SIZE = 131_072;
const MAX_BLOB_BYTES_SIZE = 2048; // in bytes

function buildGoogleStorageUri(hash: string): string {
  return `${CHAIN_ID}/${hash.slice(2, 4)}/${hash.slice(4, 6)}/${hash.slice(
    6,
    8,
  )}/${hash.slice(2)}.txt`;
}

function generateUniqueTimestamps(
  days: number,
  minTimestamps: number,
  maxTimestamps: number,
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
        faker.date.between({ from: startDay.toDate(), to: endDay.toDate() }),
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
  return Array.from({ length: amount }).map<Blob>(() => {
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
    faker.finance.ethereumAddress(),
  );
}

async function main() {
  const timestamps = generateUniqueTimestamps(
    TOTAL_DAYS,
    MIN_BLOCKS_PER_DAY,
    MAX_BLOCKS_PER_DAY,
  );
  const uniqueBlobs = generateUniqueBlobs(UNIQUE_BLOBS_AMOUNT);
  const uniqueAddresses = generateUniqueAddresses(UNIQUE_ADDRESSES_AMOUNT);

  let prevBlockNumber = 0;
  let prevSlot = 0;
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

        return Array.from({
          length: txBlobsCount,
        }).map<Prisma.BlobsOnTransactionsCreateManyInput>((_, txBlobIndex) => {
          const blobIndex = faker.number.int(uniqueBlobs.length - 1);
          const blob = uniqueBlobs[blobIndex];

          // Unreachable code, done only for type checking
          if (!blob) {
            throw new Error(
              `Index mismatch. Blob not found for index ${blobIndex}`,
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
    blobsOnTxs.some((bot) => bot.blobHash === b.versionedHash),
  );

  const uploadBlobsPromise = blobs.map(async (b) => {
    const [blobExists] = await storage
      .bucket(BUCKET_NAME)
      .file(b.gsUri)
      .exists();

    if (!blobExists) {
      await storage
        .bucket(BUCKET_NAME)
        .file(buildGoogleStorageUri(b.versionedHash))
        .save(b.data);
    }
  });
  await Promise.all(uploadBlobsPromise);

  const addressToAddressEntity = txs.reduce<
    Record<string, Prisma.AddressCreateManyInput>
  >((addressToTxData, tx) => {
    addressToTxData[tx.fromId] = {
      address: tx.fromId,
      isReceiver: false,
      ...addressToTxData[tx.fromId],
      isSender: true,
    };

    if (tx.toId) {
      addressToTxData[tx.toId] = {
        address: tx.toId,
        isSender: false,
        ...addressToTxData[tx.toId],
        isReceiver: true,
      };
    }

    return addressToTxData;
  }, {} as Record<string, Prisma.AddressCreateInput>);

  const [addessesResult, blocksResult, txsResult, blobsResult] =
    await prisma.$transaction([
      prisma.address.createMany({
        data: Object.keys(addressToAddressEntity).map(
          (key) => addressToAddressEntity[key] as Prisma.AddressCreateInput,
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
        })),
      }),
      prisma.blobsOnTransactions.createMany({
        data: blobsOnTxs,
      }),
    ]);

  console.log(
    "========================================================================",
  );
  console.log(`Data inserted for the last ${TOTAL_DAYS} days`);
  console.log(`Addresses inserted: ${addessesResult.count}`);
  console.log(`Blocks inserted: ${blocksResult.count}`);
  console.log(`Transactions inserted: ${txsResult.count}`);
  console.log(`Blobs inserted: ${blobsResult.count}`);

  console.log(
    "========================================================================",
  );

  await statsAggregator.executeAllOverallStatsQueries(),
    console.log("Overall stats created.");

  console.log(
    "========================================================================",
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
    "========================================================================",
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
