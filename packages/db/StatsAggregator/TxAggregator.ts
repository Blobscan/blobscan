import { Prisma } from "@prisma/client";

import type { BlobscanPrismaClient } from "../prisma";
import {
  buildRawWhereClause,
  buildWhereClause,
  getDefaultDatePeriod,
} from "../utils/dates";
import type { DatePeriod } from "../utils/dates";

export class TxAggregator {
  #prisma: BlobscanPrismaClient;

  constructor(prisma: BlobscanPrismaClient) {
    this.#prisma = prisma;
  }

  async backfillTxDailyAggregates(datePeriod: DatePeriod) {
    // Delete all the rows if current date is set as target date
    if (!datePeriod) {
      await this.#prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "TransactionDailyStats"`
      );
    } else {
      await this.#prisma.transactionDailyStats.deleteMany({
        where: buildWhereClause("day", datePeriod),
      });
    }

    const dailyTransactionStats = await this.getDailyTxAggregates(datePeriod);

    return this.#prisma.transactionDailyStats.createMany({
      data: dailyTransactionStats,
    });
  }

  getDailyTxAggregates(
    datePeriod: DatePeriod = getDefaultDatePeriod()
  ): Prisma.PrismaPromise<Prisma.TransactionDailyStatsCreateManyInput[]> {
    const dateField = Prisma.sql`timestamp`;
    const whereClause = buildRawWhereClause(dateField, datePeriod);

    return this.#prisma.$queryRaw<
      Prisma.TransactionDailyStatsCreateManyInput[]
    >`
      SELECT
        DATE_TRUNC('day', ${dateField}) as "day",
        COUNT(id)::Int as "totalTransactions",
        COUNT(DISTINCT "fromId")::Int as "totalUniqueSenders",
        COUNT(DISTINCT "toId")::Int as "totalUniqueReceivers"
      FROM "Transaction"
      ${whereClause}
      GROUP BY "day"
    `;
  }

  executeOverallTxStatsQuery() {
    return this.#prisma.$executeRaw`
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
        COUNT(DISTINCT "toId")::INT as "totalUniqueReceivers",
        COUNT(DISTINCT "fromId")::INT as "totalUniqueSenders",
        NOW() as "updatedAt"
      FROM "Transaction"
      ON CONFLICT(id) DO UPDATE SET
        "totalTransactions" = EXCLUDED."totalTransactions",
        "totalUniqueReceivers" = EXCLUDED."totalUniqueReceivers",
        "totalUniqueSenders" = EXCLUDED."totalUniqueSenders",
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }

  upsertOverallTxStats(
    newTxs: number,
    newUniqueReceivers: number,
    newUniqueSenders: number
  ) {
    return this.#prisma.$executeRaw`
      INSERT INTO "TransactionOverallStats" as stats (
        id,
        "totalTransactions",
        "totalUniqueReceivers",
        "totalUniqueSenders",
        "updatedAt"
      )
      VALUES (
        1,
        ${newTxs},
        ${newUniqueReceivers},
        ${newUniqueSenders},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
        SET
          "totalTransactions" = stats."totalTransactions" + EXCLUDED."totalTransactions",
          "totalUniqueReceivers" = stats."totalUniqueReceivers" + EXCLUDED."totalUniqueReceivers",
          "totalUniqueSenders" = stats."totalUniqueSenders" + EXCLUDED."totalUniqueSenders",
          "updatedAt" = EXCLUDED."updatedAt"
        WHERE stats.id = 1
    `;
  }
}
