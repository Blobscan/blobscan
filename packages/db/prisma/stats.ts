import { Prisma, type PrismaClient } from "@prisma/client";

import {
  buildRawWhereClause,
  getDefaultDatePeriod,
  type DatePeriod,
} from "./utils/dates";

export function queryDailyBlobStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod = getDefaultDatePeriod(),
): Prisma.PrismaPromise<Prisma.BlobDailyStatsCreateManyInput[]> {
  const dateField = Prisma.sql`"Transaction"."timestamp"`;
  const whereClause = buildRawWhereClause(dateField, datePeriod);

  return prisma.$queryRaw<Prisma.BlobDailyStatsCreateManyInput[]>`
      SELECT 
        DATE_TRUNC('day', ${dateField}) as "day",
        COUNT("BlobsOnTransactions"."blobHash")::Int as "totalBlobs",
        COUNT(DISTINCT "Blob"."versionedHash")::INT as "totalUniqueBlobs",
        SUM("Blob".size) as "totalBlobSize",
        AVG("Blob".size)::FLOAT as "avgBlobSize"
      FROM "Blob"
      JOIN "BlobsOnTransactions" ON "BlobsOnTransactions"."blobHash" = "Blob"."versionedHash"
      JOIN "Transaction" ON "Transaction"."hash" = "BlobsOnTransactions"."txHash"
      ${whereClause}
      GROUP BY "day"
    `;
}

export function queryDailyTransactionStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod = getDefaultDatePeriod(),
): Prisma.PrismaPromise<Prisma.TransactionDailyStatsCreateManyInput[]> {
  const dateField = Prisma.sql`timestamp`;
  const whereClause = buildRawWhereClause(dateField, datePeriod);

  return prisma.$queryRaw<Prisma.TransactionDailyStatsCreateManyInput[]>`
    SELECT
      DATE_TRUNC('day', ${dateField}) as "day",
      COUNT(id)::Int as "totalTransactions",
      COUNT(DISTINCT "from")::Int as "totalUniqueSenders",
      COUNT(DISTINCT "to")::Int as "totalUniqueReceivers"
    FROM "Transaction"
    ${whereClause}
    GROUP BY "day"
  `;
}

export function queryDailyBlockStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod = getDefaultDatePeriod(),
): Prisma.PrismaPromise<Prisma.BlockDailyStatsCreateManyInput[]> {
  const dateField = Prisma.sql`timestamp`;
  const whereClause = buildRawWhereClause(dateField, datePeriod);

  return prisma.$queryRaw<Prisma.BlockDailyStatsCreateManyInput[]>`
    SELECT COUNT(id)::Int as "totalBlocks", DATE_TRUNC('day', ${dateField}) as "day"
    FROM "Block"
    ${whereClause}
    GROUP BY "day"
  `;
}

export const backfillDailyStatsPromise = (prisma: PrismaClient) => [
  prisma.$executeRaw`
    INSERT INTO "BlockOverallStats" (
      id,
      "totalBlocks",
      "updatedAt"
    )
    SELECT
      1 as id,
      COUNT("id")::INT as "totalBlocks",
      NOW() as "updatedAt"
    FROM "Block"
    ON CONFLICT(id) DO UPDATE SET
      "totalBlocks" = EXCLUDED."totalBlocks",
      "updatedAt" = EXCLUDED."updatedAt"
  `,
  prisma.$executeRaw`
    INSERT INTO "TransactionOverallStats" (
      id,
      "totalTransactions",
      "totalUniqueReceivers",
      "totalUniqueSenders",
      "updatedAt"
    )
    SELECT
      1 as id,
      COUNT("id")::INT as "totalTransactions",
      COUNT(DISTINCT "to")::INT as "totalUniqueReceivers",
      COUNT(DISTINCT "from")::INT as "totalUniqueSenders",
      NOW() as "updatedAt"
    FROM "Transaction"
    ON CONFLICT(id) DO UPDATE SET
      "totalTransactions" = EXCLUDED."totalTransactions",
      "totalUniqueReceivers" = EXCLUDED."totalUniqueReceivers",
      "totalUniqueSenders" = EXCLUDED."totalUniqueSenders",
      "updatedAt" = EXCLUDED."updatedAt"
  `,
  prisma.$executeRaw`
        INSERT INTO "BlobOverallStats" (
          id,
          "totalBlobs",
          "totalUniqueBlobs",
          "totalBlobSize",
          "avgBlobSize",
          "updatedAt"
        )
        SELECT
          1 as id,
          COUNT("BlobsOnTransactions"."blobHash")::Int as "totalBlobs",
          COUNT(DISTINCT "Blob"."versionedHash")::INT as "totalUniqueBlobs",
          SUM("Blob".size) as "totalBlobSize",
          AVG("Blob".size)::FLOAT as "avgBlobSize",
          NOW() as "updatedAt"
        FROM "Blob"
        JOIN "BlobsOnTransactions" ON "BlobsOnTransactions"."blobHash" = "Blob"."versionedHash"
        ON CONFLICT(id) DO UPDATE SET
          "totalBlobs" = EXCLUDED."totalBlobs",
          "totalUniqueBlobs" = EXCLUDED."totalUniqueBlobs",
          "totalBlobSize" = EXCLUDED."totalBlobSize",
          "avgBlobSize" = EXCLUDED."avgBlobSize",
          "updatedAt" = EXCLUDED."updatedAt"
      `,
];
