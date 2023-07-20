import { Prisma } from "@prisma/client";

import type { BlockNumberRange } from "../types";
import type { DatePeriod } from "../utils/dates";
import { buildRawWhereClause } from "../utils/dates";

export const statsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Stats Extension",
    model: {
      blobDailyStats: {
        deleteAll() {
          return prisma.$executeRawUnsafe("TRUNCATE TABLE BlobDailyStats");
        },
        fill(datePeriod: DatePeriod) {
          const dateField = Prisma.sql`bl."timestamp"`;
          const whereClause = buildRawWhereClause(dateField, datePeriod);

          return prisma.$executeRaw`
            INSERT INTO "BlobDailyStats"(
              "day",
              "totalBlobs",
              "totalUniqueBlobs",
              "totalBlobSize",
              "avgBlobSize"
            )
            SELECT 
              DATE_TRUNC('day', ${dateField}) AS "day",
              COUNT(btx."blobHash")::INT AS "totalBlobs",
              COUNT(DISTINCT b."versionedHash")::INT AS "totalUniqueBlobs",
              SUM(b.size) AS "totalBlobSize",
              AVG(b.size)::FLOAT AS "avgBlobSize"
            FROM "Blob" b
              JOIN "BlobsOnTransactions" btx ON btx."blobHash" = b."versionedHash"
              JOIN "Transaction" tx ON tx."hash" = btx."txHash"
              JOIN "Block" bl ON bl."number" = tx."blockNumber"
            ${whereClause}
            GROUP BY "day"
            ON CONFLICT ("day") DO UPDATE SET
              "totalBlobs" = EXCLUDED."totalBlobs",
              "totalUniqueBlobs" = EXCLUDED."totalUniqueBlobs",
              "totalBlobSize" = EXCLUDED."totalBlobSize",
              "avgBlobSize" = EXCLUDED."avgBlobSize"
          `;
        },
      },
      blobOverallStats: {
        backfill() {
          return prisma.$executeRaw`
          INSERT INTO "BlobOverallStats" (
            id,
            "totalBlobs",
            "totalUniqueBlobs",
            "totalBlobSize",
            "avgBlobSize",
            "updatedAt"
          )
          SELECT
            1 AS id,
            COUNT(btx."blobHash")::INT AS "totalBlobs",
            COUNT(DISTINCT b."versionedHash")::INT AS "totalUniqueBlobs",
            SUM(b.size) AS "totalBlobSize",
            AVG(b.size)::FLOAT AS "avgBlobSize",
            NOW() AS "updatedAt"
          FROM "Blob" b
          JOIN "BlobsOnTransactions" btx ON btx."blobHash" = b."versionedHash"
          ON CONFLICT (id) DO UPDATE SET
            "totalBlobs" = EXCLUDED."totalBlobs",
            "totalUniqueBlobs" = EXCLUDED."totalUniqueBlobs",
            "totalBlobSize" = EXCLUDED."totalBlobSize",
            "avgBlobSize" = EXCLUDED."avgBlobSize",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$executeRaw`
            INSERT INTO "BlobOverallStats" AS st (
              id,
              "totalBlobs",
              "totalUniqueBlobs",
              "totalBlobSize",
              "avgBlobSize",
              "updatedAt"
            )
            SELECT 
              1 AS id,
              COUNT(btx."blobHash")::INT AS "totalBlobs",
              COUNT(DISTINCT CASE WHEN b."firstBlockNumber" BETWEEN ${from} AND ${to} THEN b."versionedHash" END)::INT AS "totalUniqueBlobs",
              SUM(b.size) AS "totalBlobSize",
              AVG(b.size)::FLOAT AS "avgBlobSize",
              NOW() AS "updatedAt"
            FROM "Blob" b
              JOIN "BlobsOnTransactions" btx ON btx."blobHash" = b."versionedHash"
              JOIN "Transaction" tx ON tx."hash" = btx."txHash"
              JOIN "Block" bck ON bck."number" = tx."blockNumber"
            WHERE bck."number" BETWEEN ${from} AND ${to}
            ON CONFLICT (id) DO UPDATE SET
              "totalBlobs" = st."totalBlobs" + EXCLUDED."totalBlobs",
              "totalUniqueBlobs" = st."totalUniqueBlobs" + EXCLUDED."totalUniqueBlobs",
              "totalBlobSize" = st."totalBlobSize" + EXCLUDED."totalBlobSize",
              "avgBlobSize" = st."avgBlobSize" + (EXCLUDED."totalBlobSize" - st."avgBlobSize") / (st."totalBlobs" + EXCLUDED."totalBlobs"),
              "updatedAt" = EXCLUDED."updatedAt"
          `;
        },
      },
      blockDailyStats: {
        deleteAll() {
          return prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlockDailyStats"`);
        },
        fill(datePeriod: DatePeriod) {
          const dateField = Prisma.sql`timestamp`;
          const whereClause = buildRawWhereClause(dateField, datePeriod);

          return prisma.$executeRaw`
          INSERT INTO "BlockDailyStats"(day, "totalBlocks")
          SELECT
            DATE_TRUNC('day', ${dateField}) as "day",
            COUNT(hash)::Int as "totalBlocks"
          FROM "Block"
          ${whereClause}
          GROUP BY "day"
          ON CONFLICT (day) DO UPDATE SET
            "totalBlocks" = EXCLUDED."totalBlocks" 
        `;
        },
      },
      blockOverallStats: {
        backfill() {
          return prisma.$executeRaw`
          INSERT INTO "BlockOverallStats" as stats (
            id,
            "totalBlocks",
            "updatedAt"
          )
          SELECT
            1 as id,
            COUNT("hash")::INT as "totalBlocks",
            NOW() as "updatedAt"
          FROM "Block"
          ON CONFLICT (id) DO UPDATE SET
            "totalBlocks" = EXCLUDED."totalBlocks",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$executeRaw`
            INSERT INTO "BlockOverallStats" AS stats (
              id,
              "totalBlocks",
              "updatedAt"
            )
            SELECT
              1 as id,
              COUNT("hash")::INT as "totalBlocks",
              NOW() as "updatedAt"
            FROM "Block"
            WHERE "number" BETWEEN ${from} AND ${to}
            ON CONFLICT (id) DO UPDATE SET
              "totalBlocks" = stats."totalBlocks" + EXCLUDED."totalBlocks",
              "updatedAt" = EXCLUDED."updatedAt"
          `;
        },
      },
      transactionDailyStats: {
        deleteAll() {
          return prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "TransactionDailyStats"`
          );
        },
        fill(datePeriod: DatePeriod) {
          const dateField = Prisma.sql`b."timestamp"`;
          const whereClause = buildRawWhereClause(dateField, datePeriod);

          return prisma.$executeRaw`
          INSERT INTO "TransactionDailyStats"(
            "day",
            "totalTransactions",
            "totalUniqueReceivers",
            "totalUniqueSenders"
          )
          SELECT 
            DATE_TRUNC('day', ${dateField}) AS "day",
            COUNT(tx."hash")::INT AS "totalTransactions",
            COUNT(DISTINCT tx."toId")::INT AS "totalUniqueReceivers",
            COUNT(DISTINCT tx."fromId")::INT AS "totalUniqueSenders"
          FROM "Transaction" tx
            JOIN "Block" b ON b.number = tx."blockNumber"
          ${whereClause}
          GROUP BY "day"
          ON CONFLICT ("day") DO UPDATE SET
            "totalTransactions" = EXCLUDED."totalTransactions",
            "totalUniqueReceivers" = EXCLUDED."totalUniqueReceivers",
            "totalUniqueSenders" = EXCLUDED."totalUniqueSenders"
          `;
        },
      },
      transactionOverallStats: {
        backfill() {
          return prisma.$executeRaw`
          INSERT INTO "TransactionOverallStats" (
            id,
            "totalTransactions",
            "totalUniqueReceivers",
            "totalUniqueSenders",
            "updatedAt"
          )
          SELECT
            1 AS id,
            COUNT("hash")::INT AS "totalTransactions",
            COUNT(DISTINCT "toId")::INT AS "totalUniqueReceivers",
            COUNT(DISTINCT "fromId")::INT AS "totalUniqueSenders",
            NOW() AS "updatedAt"
          FROM "Transaction"
          ON CONFLICT (id) DO UPDATE SET
            "totalTransactions" = EXCLUDED."totalTransactions",
            "totalUniqueReceivers" = EXCLUDED."totalUniqueReceivers",
            "totalUniqueSenders" = EXCLUDED."totalUniqueSenders",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$executeRaw`
            INSERT INTO "TransactionOverallStats" AS stats (
              id,
              "totalTransactions",
              "totalUniqueReceivers",
              "totalUniqueSenders",
              "updatedAt"
            )
            SELECT
              1 AS id,
              COUNT("hash")::INT AS "totalTransactions",
              COUNT(DISTINCT CASE WHEN taddr."firstBlockNumberAsReceiver" BETWEEN ${from} AND ${to} THEN taddr.address END)::INT AS "totalUniqueReceivers",
              COUNT(DISTINCT CASE WHEN faddr."firstBlockNumberAsSender" BETWEEN ${from} AND ${to} THEN faddr.address END )::INT AS "totalUniqueSenders",
              NOW() AS "updatedAt"
            FROM "Transaction" tx JOIN "Address" faddr ON faddr.address = tx."fromId" JOIN "Address" taddr ON taddr.address = tx."toId"
            WHERE tx."blockNumber" BETWEEN ${from} AND ${to}
            ON CONFLICT (id) DO UPDATE SET
              "totalTransactions" = stats."totalTransactions" + EXCLUDED."totalTransactions",
              "totalUniqueReceivers" = stats."totalUniqueReceivers" + EXCLUDED."totalUniqueReceivers",
              "totalUniqueSenders" = stats."totalUniqueSenders" + EXCLUDED."totalUniqueSenders",
              "updatedAt" = EXCLUDED."updatedAt"
          `;
        },
      },
    },
  })
);

export type StatsExtendedPrismaClient = ReturnType<typeof statsExtension>;
