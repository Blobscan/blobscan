import type { BlobDataStorageReference } from "@prisma/client";

import dayjs from "@blobscan/dayjs";

import { prisma } from "..";
import { DataGenerator } from "./DataGenerator";
import { seedParams } from "./params";
import { performPrismaOpInBatches } from "./utils";

const BATCH_SIZE = 1000;
const STORAGE_BATCH_SIZE = 100;

async function main() {
  const dataGenerator = new DataGenerator(seedParams);

  // 1. Generate mock data
  const dataGenerationStart = performance.now();

  const addresses = dataGenerator.generateUniqueAddresses();
  const dbBlocks = dataGenerator.generateDBBlocks();
  const dbBlockTxs = dataGenerator.generateDBBlockTransactions(
    dbBlocks,
    addresses
  );
  const dbTxs = dbBlockTxs.flat();
  const dbAddresses = dataGenerator.generateDBAddresses(addresses, dbTxs);
  const dbBlobs = dataGenerator.generateDBBlobs();
  const dbBlobsOnTxs = dataGenerator.generateDBBlobOnTxs(dbBlockTxs, dbBlobs);

  const dataGenerationEnd = performance.now();

  const batches = Math.ceil(dbBlobs.length / STORAGE_BATCH_SIZE);
  const dbBlobDataStorageRefs: BlobDataStorageReference[] = [];

  const blobsUploadStart = performance.now();
  // 2. Store blobs' data in storages
  for (let i = 0; i < batches; i++) {
    const blobsBatch = dbBlobs.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const blobsDataBatch = dataGenerator.generateBlobData(
      blobsBatch.map((b) => b.size)
    );

    const blobDataStorageRefs: BlobDataStorageReference[][] = await Promise.all(
      blobsDataBatch.map(async (blobData, i) => {
        const blob = blobsBatch[i];
        if (!blob) {
          throw new Error("Blob not found");
        }

        await prisma.blobData.create({
          data: {
            id: blob.versionedHash,
            data: Buffer.from(blobData.slice(2), "hex"),
          },
        });

        return [
          {
            blobHash: blob.versionedHash,
            blobStorage: "POSTGRES",
            dataReference: blob.versionedHash,
          },
        ];
      })
    );

    dbBlobDataStorageRefs.push(...blobDataStorageRefs.flat());
  }

  const blobsUploadEnd = performance.now();

  // 3. Insert data into the database

  const dataInsertionStart = performance.now();

  console.log(
    "========================================================================"
  );

  await performPrismaOpInBatches(dbBlocks, prisma.block.createMany);
  console.log(`Blocks inserted: ${dbBlocks.length}`);

  await performPrismaOpInBatches(dbAddresses, prisma.address.createMany);
  console.log(`Addresses inserted: ${dbAddresses.length}`);

  await performPrismaOpInBatches(dbTxs, prisma.transaction.createMany);
  console.log(`Transactions inserted: ${dbBlockTxs.length}`);

  await performPrismaOpInBatches(dbBlobs, prisma.blob.createMany);
  console.log(`Blobs inserted: ${dbBlobs.length}`);

  await performPrismaOpInBatches(
    dbBlobDataStorageRefs,
    prisma.blobDataStorageReference.createMany
  );
  console.log(
    `Blob storage references inserted: ${dbBlobDataStorageRefs.length}`
  );

  await performPrismaOpInBatches(
    dbBlobsOnTxs,
    prisma.blobsOnTransactions.createMany
  );
  console.log(`Blobs on transactions inserted: ${dbBlobsOnTxs.length}`);

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
    `Blobs upload took ${(blobsUploadEnd - blobsUploadStart) / 1000} seconds`
  );

  console.log(`Data inserted for the last ${seedParams.totalDays} days`);

  await Promise.all([
    prisma.blobOverallStats.populate(),
    prisma.blockOverallStats.populate(),
    prisma.transactionOverallStats.populate(),
  ]);

  console.log("Overall stats created.");

  console.log(
    "========================================================================"
  );

  const yesterdayPeriod = {
    to: dayjs().subtract(1, "day").startOf("day").toISOString(),
  };

  await Promise.all([
    prisma.blobDailyStats.populate(yesterdayPeriod),
    prisma.blockDailyStats.populate(yesterdayPeriod),
    prisma.transactionDailyStats.populate(yesterdayPeriod),
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
