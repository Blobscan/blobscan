import type {
  BlobOverallStats,
  BlockOverallStats,
  TransactionOverallStats,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

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
              COUNT("blobsTxs"."blobHash")::INT AS "totalBlobs",
              COUNT(DISTINCT blob."versionedHash")::INT AS "totalUniqueBlobs",
              SUM(blob.size) AS "totalBlobSize",
              AVG(blob.size)::FLOAT AS "avgBlobSize"
            FROM "Blob" blob
              JOIN "BlobsOnTransactions" "blobsTxs" ON "blobsTxs"."blobHash" = blob."versionedHash"
              JOIN "Transaction" tx ON tx."hash" = "blobsTxs"."txHash"
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
            COUNT("BlobsOnTransactions"."blobHash")::INT AS "totalBlobs",
            COUNT(DISTINCT "Blob"."versionedHash")::INT AS "totalUniqueBlobs",
            SUM("Blob".size) AS "totalBlobSize",
            AVG("Blob".size)::FLOAT AS "avgBlobSize",
            NOW() AS "updatedAt"
          FROM "Blob"
          JOIN "BlobsOnTransactions" ON "BlobsOnTransactions"."blobHash" = "Blob"."versionedHash"
          ON CONFLICT (id) DO UPDATE SET
            "totalBlobs" = EXCLUDED."totalBlobs",
            "totalUniqueBlobs" = EXCLUDED."totalUniqueBlobs",
            "totalBlobSize" = EXCLUDED."totalBlobSize",
            "avgBlobSize" = EXCLUDED."avgBlobSize",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        },
        increment({
          totalBlobs,
          totalUniqueBlobs,
          totalBlobSize,
          avgBlobSize,
        }: Omit<BlobOverallStats, "updatedAt">) {
          return prisma.$executeRaw`
            INSERT INTO "BlobOverallStats" AS stats (
              id,
              "totalBlobs",
              "totalUniqueBlobs",
              "totalBlobSize",
              "avgBlobSize",
              "updatedAt"
            )
            VALUES (
              1,
              ${totalBlobs},
              ${totalUniqueBlobs},
              ${totalBlobSize},
              ${avgBlobSize},
              NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              "totalBlobs" = stats."totalBlobs" + EXCLUDED."totalBlobs",
              "totalUniqueBlobs" = stats."totalUniqueBlobs" + EXCLUDED."totalUniqueBlobs",
              "totalBlobSize" = stats."totalBlobSize" + EXCLUDED."totalBlobSize",
              "avgBlobSize" = stats."avgBlobSize" + (EXCLUDED."totalBlobSize" - stats."avgBlobSize") / (stats."totalBlobs" + EXCLUDED."totalBlobs"),
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
        increment({ totalBlocks }: Omit<BlockOverallStats, "updatedAt">) {
          return prisma.$executeRaw`
            INSERT INTO "BlockOverallStats" AS stats (
              id,
              "totalBlocks",
              "updatedAt"
            )
            VALUES (
              1,
              ${totalBlocks},
              NOW()
            )
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
          const dateField = Prisma.sql`"Block"."timestamp"`;
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
          FROM "Transaction" AS tx
            JOIN "Block" ON "Block"."number" = tx."blockNumber"
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
        increment({
          totalTransactions,
          totalUniqueReceivers,
          totalUniqueSenders,
        }: Omit<TransactionOverallStats, "updatedAt">) {
          return prisma.$executeRaw`
            INSERT INTO "TransactionOverallStats" AS stats (
              id,
              "totalTransactions",
              "totalUniqueReceivers",
              "totalUniqueSenders",
              "updatedAt"
            )
            VALUES (
              1,
              ${totalTransactions},
              ${totalUniqueReceivers},
              ${totalUniqueSenders},
              NOW()
            )
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
