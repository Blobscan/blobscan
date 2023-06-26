import { Prisma, type PrismaClient } from "@prisma/client";

import {
  buildRawWhereClause,
  buildWhereClause,
  getDefaultDatePeriod,
  type DatePeriod,
} from "../utils/dates";

export class BlobAggregator {
  #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async backfillBlobDailyAggregates(datePeriod: DatePeriod) {
    // TODO: implement some sort of bulk processing mechanism.

    // Delete all the rows if current date is set as target date
    if (!datePeriod) {
      await this.#prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlobDailyStats"`);
    } else {
      await this.#prisma.blobDailyStats.deleteMany({
        where: buildWhereClause("day", datePeriod),
      });
    }

    const dailyBlobStats = await this.getDailyBlobAggregates(datePeriod);

    return this.#prisma.blobDailyStats.createMany({
      data: dailyBlobStats,
    });
  }

  getDailyBlobAggregates(
    datePeriod: DatePeriod = getDefaultDatePeriod(),
  ): Prisma.PrismaPromise<Prisma.BlobDailyStatsCreateManyInput[]> {
    const dateField = Prisma.sql`"Transaction"."timestamp"`;
    const whereClause = buildRawWhereClause(dateField, datePeriod);

    return this.#prisma.$queryRaw<Prisma.BlobDailyStatsCreateManyInput[]>`
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

  executeOverallBlobStatsQuery() {
    return this.#prisma.$executeRaw`
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
      ON CONFLICT (id) DO UPDATE SET
        "totalBlobs" = EXCLUDED."totalBlobs",
        "totalUniqueBlobs" = EXCLUDED."totalUniqueBlobs",
        "totalBlobSize" = EXCLUDED."totalBlobSize",
        "avgBlobSize" = EXCLUDED."avgBlobSize",
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }

  upsertOverallBlobStats(
    newBlobs: number,
    newUniqueBlobs: number,
    newBlobSize: number,
  ) {
    return this.#prisma.$executeRaw`
      INSERT INTO "BlobOverallStats" as stats (
        id,
        "totalBlobs",
        "totalUniqueBlobs",
        "totalBlobSize",
        "avgBlobSize",
        "updatedAt"
      )
      VALUES (
        1,
        ${newBlobs},
        ${newUniqueBlobs},
        ${newBlobSize},
        ${newBlobSize / newBlobs},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        "totalBlobs" = stats."totalBlobs" + EXCLUDED."totalBlobs",
        "totalUniqueBlobs" = stats."totalUniqueBlobs" + EXCLUDED."totalUniqueBlobs",
        "totalBlobSize" = stats."totalBlobSize" + EXCLUDED."totalBlobSize",
        "avgBlobSize" = stats."avgBlobSize" + (EXCLUDED."totalBlobSize" - stats."avgBlobSize") / (stats."totalBlobs" + EXCLUDED."totalBlobs"),
        "updatedAt" = EXCLUDED."updatedAt"
      WHERE
        stats.id = 1
    `;
  }
}
