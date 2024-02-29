import type { Redis } from "ioredis";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import type { PrismaPromise, RawDatePeriod } from "@blobscan/db";

import { PeriodicUpdater } from "../PeriodicUpdater";
import { formatDate, log } from "../utils";

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
    const name = "daily-stats-syncer";
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

        const yesterday = dayjs().subtract(1, "day");

        const lastDailyStatsDays = await Promise.all(
          Object.values(dailyStatsModels).map((m) =>
            m
              .findFirst(findLatestArgs)
              .then((stats) => (stats?.day ? dayjs(stats.day) : undefined))
          )
        );

        if (
          lastDailyStatsDays.every((lastDay) =>
            lastDay ? lastDay?.isSame(yesterday, "day") : false
          )
        ) {
          log("debug", `Skipping stats aggregation. Already up to date`, {
            updater: name,
          });

          return;
        }

        const entityToPopulatedDays = await Promise.all(
          Object.entries(dailyStatsModels).map(async ([entity, model], i) => {
            const lastDailyStatsDay = lastDailyStatsDays[i];

            const populatedDays = await model.populate({
              from: lastDailyStatsDay
                ? dayjs(lastDailyStatsDay).add(1, "day")
                : undefined,
              to: yesterday,
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

        log(
          "info",
          `Daily data up to day ${formatDate(
            yesterday
          )} aggregated. ${results} successfully.`,
          {
            updater: name,
          }
        );
      },
    });
  }
}
