import { Prisma, type PrismaClient } from "@prisma/client";

import {
  buildRawWhereClause,
  buildWhereClause,
  getDefaultDatePeriod,
  type DatePeriod,
} from "../utils/dates";

export class TxAggregator {
  #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async backfillTxDailyAggregates(datePeriod: DatePeriod) {
    // Delete all the rows if current date is set as target date
    if (!datePeriod) {
      await this.#prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "TransactionDailyStats"`,
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
    datePeriod: DatePeriod = getDefaultDatePeriod(),
  ): Prisma.PrismaPromise<Prisma.TransactionDailyStatsCreateManyInput[]> {
    const dateField = Prisma.sql`timestamp`;
    const whereClause = buildRawWhereClause(dateField, datePeriod);

    return this.#prisma.$queryRaw<
      Prisma.TransactionDailyStatsCreateManyInput[]
    >`
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
        COUNT(DISTINCT "to")::INT as "totalUniqueReceivers",
        COUNT(DISTINCT "from")::INT as "totalUniqueSenders",
        NOW() as "updatedAt"
      FROM "Transaction"
      ON CONFLICT(id) DO UPDATE SET
        "totalTransactions" = EXCLUDED."totalTransactions",
        "totalUniqueReceivers" = EXCLUDED."totalUniqueReceivers",
        "totalUniqueSenders" = EXCLUDED."totalUniqueSenders",
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }
}
