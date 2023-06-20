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

  updateOverallTxStats(
    newTxs: number,
    newUniqueReceivers: number,
    newUniqueSenders: number,
  ) {
    return this.#prisma.$executeRaw`
      UPDATE "TransactionOverallStats"
        SET
          "totalTransactions" = "totalTransactions" + ${newTxs},
          "totalUniqueReceivers" = "totalUniqueReceivers" + ${newUniqueReceivers},
          "totalUniqueSenders" = "totalUniqueSenders" + ${newUniqueSenders},
          "updatedAt" = NOW()
        WHERE id = 1
    `;
  }
}
