import type { Redis } from "ioredis";

import { normalizeDailyDate, normalizeDate, prisma } from "@blobscan/db";
import type { PrismaPromise, RawDatePeriod } from "@blobscan/db";

import { PeriodicUpdater } from "../PeriodicUpdater";
import { formatDate } from "../utils";

interface DailyStatsModel {
  findFirst: (args: {
    select: { day: boolean };
    orderBy: { day: "desc" };
  }) => PrismaPromise<{ day: Date } | null>;
  populate: (datePeriod: RawDatePeriod) => PrismaPromise<number>;
}

const dailyStatsModels: Record<string, DailyStatsModel> = {
  blob: prisma.blobDailyStats,
  block: prisma.blockDailyStats,
  transaction: prisma.transactionDailyStats,
};

export class DailyStatsUpdater extends PeriodicUpdater {
  constructor(redisUriOrConnection: string | Redis) {
    const name = "daily";
    super({
      name,
      redisUriOrConnection,
      updaterFn: async () => {
        const findLatestArgs: {
          select: {
            day: boolean;
          };
          orderBy: {
            day: "desc";
          };
        } = {
          select: {
            day: true,
          },
          orderBy: {
            day: "desc",
          },
        };

        const lastIndexedBlock = await prisma.block.findLatest();

        if (!lastIndexedBlock) {
          this.logger.debug(
            "Skipping stats aggregation. No blocks indexed yet"
          );

          return;
        }
        const targetDate = normalizeDate(lastIndexedBlock.timestamp).subtract(
          1,
          "day"
        );
        const targetDay = normalizeDailyDate(targetDate);

        const lastDailyStatsDays = await Promise.all(
          Object.values(dailyStatsModels).map((m) =>
            m
              .findFirst(findLatestArgs)
              .then((stats) =>
                stats?.day ? normalizeDate(stats.day) : undefined
              )
          )
        );

        if (
          lastDailyStatsDays.every((lastDay) =>
            lastDay ? lastDay?.isSame(targetDay, "day") : false
          )
        ) {
          this.logger.debug(`Skipping stats aggregation. Already up to date`);

          return;
        }

        const entityToPopulatedDays = await Promise.all(
          Object.entries(dailyStatsModels).map(async ([entity, model], i) => {
            const lastDailyStatsDay = lastDailyStatsDays[i];
            const startDate = lastDailyStatsDay
              ? lastDailyStatsDay.add(1, "day")
              : undefined;

            const populatedDays = await model.populate({
              from: startDate,
              to: targetDay,
            });

            return [entity, populatedDays];
          })
        );

        const results = entityToPopulatedDays
          .map(
            ([entity, populatedDays]) =>
              `${populatedDays} ${entity} daily stats created`
          )
          .join(", ");

        this.logger.info(
          `Daily data up to day ${formatDate(
            targetDay
          )} aggregated. ${results} successfully.`
        );
      },
    });
  }
}
