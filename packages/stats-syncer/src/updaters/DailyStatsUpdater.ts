import type { Redis } from "ioredis";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import type { RawDatePeriod } from "@blobscan/db";

import { PeriodicUpdater } from "../PeriodicUpdater";
import { log } from "../utils";

export class DailyStatsUpdater extends PeriodicUpdater {
  constructor(redisUriOrConnection: string | Redis) {
    const name = "daily-stats-syncer";
    super({
      name,
      redisUriOrConnection,
      updaterFn: async () => {
        const yesterday = dayjs().subtract(1, "day");
        const datePeriod: RawDatePeriod = {
          from: yesterday.startOf("day"),
          to: yesterday.endOf("day"),
        };

        await Promise.all([
          prisma.blobDailyStats.populate(datePeriod),
          prisma.blockDailyStats.populate(datePeriod),
          prisma.transactionDailyStats.populate(datePeriod),
        ]);

        log(
          "info",
          `Day ${yesterday.format(
            "YYYY-MM-DD"
          )} stats aggregated successfully.`,
          {
            updater: name,
          }
        );
      },
    });
  }
}
