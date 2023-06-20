import { type PrismaClient } from "@prisma/client";

import { getDefaultDatePeriod, type DatePeriod } from "../utils/dates";
import { BlobAggregator } from "./BlobAggregator";
import { BlockAggregator } from "./BlockAggregator";
import { TxAggregator } from "./TxAggregator";

export class StatsAggregator {
  #prisma: PrismaClient;

  blob: BlobAggregator;
  block: BlockAggregator;
  tx: TxAggregator;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;

    this.blob = new BlobAggregator(prisma);
    this.block = new BlockAggregator(prisma);
    this.tx = new TxAggregator(prisma);
  }

  backfillAllDailyAggregates(datePeriod: DatePeriod) {
    return Promise.all([
      this.blob.backfillBlobDailyAggregates(datePeriod),
      this.block.backfillBlockDailyAggregates(datePeriod),
      this.tx.backfillTxDailyAggregates(datePeriod),
    ]);
  }

  getAllDailyAggregates(datePeriod: DatePeriod = getDefaultDatePeriod()) {
    return Promise.all([
      this.blob.getDailyBlobAggregates(datePeriod),
      this.block.getDailyBlockAggregates(datePeriod),
      this.tx.getDailyTxAggregates(datePeriod),
    ]);
  }

  executeAllOverallStatsQueries() {
    return Promise.all([
      this.blob.executeOverallBlobStatsQuery(),
      this.block.executeOverallBlockStatsQuery(),
      this.tx.executeOverallTxStatsQuery(),
    ]);
  }
}
