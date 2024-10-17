import { describe, expect, it } from "vitest";

import dayjs, {
  MIN_DATE,
  toDailyDate,
  toDailyDatePeriod,
} from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import { prisma } from "../../../prisma";
import type { DatePeriodLike } from "../../../prisma/types";
import { indexBlock } from "../stats";

export type DailyStatsModel =
  | "blobDailyStats"
  | "blockDailyStats"
  | "transactionDailyStats";

function hasDailyStatsExtensionFns(model: unknown): model is {
  populate: (datePeriod: DatePeriodLike) => void;
  findMany: (opts?: unknown) => Promise<
    {
      day: Date;
    }[]
  >;
} {
  return (
    typeof model === "object" &&
    model !== null &&
    "populate" in model &&
    "deleteAll" in model
  );
}

export function getDailyStatsPrismaModel(modelName: DailyStatsModel) {
  const model = prisma[modelName];

  if (hasDailyStatsExtensionFns(model)) {
    return model;
  }

  throw new Error(`Model ${modelName.toString()} has no daily stats functions`);
}

function getExpectedAggregatedDays(
  model: DailyStatsModel,
  datePeriodLike: DatePeriodLike
) {
  const { from: from = MIN_DATE, to: to = new Date() } =
    toDailyDatePeriod(datePeriodLike);
  let elementTimestamps: string[];

  switch (model) {
    case "blobDailyStats": {
      elementTimestamps = fixtures
        .getBlobs({ datePeriod: datePeriodLike })
        .map(({ block: { timestamp } }) => timestamp);

      break;
    }
    case "blockDailyStats": {
      elementTimestamps = fixtures
        .getBlocks({ datePeriod: datePeriodLike })
        .map(({ timestamp }) => timestamp);

      break;
    }
    case "transactionDailyStats": {
      elementTimestamps = fixtures
        .getTransactions({ datePeriod: datePeriodLike })
        .map(({ blockTimestamp }) => blockTimestamp);

      break;
    }
  }

  return Array.from(
    elementTimestamps.reduce<Set<string>>((days, timestamp) => {
      if (dayjs(timestamp).isBetween(from, to)) {
        days.add(toDailyDate(timestamp, "startOf").toISOString());
      }

      return days;
    }, new Set<string>())
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

export function runDailyStatsFunctionsTests(
  modelName: DailyStatsModel,
  {
    assertStats,
  }: {
    assertStats: (datePeriod: DatePeriodLike) => Promise<void>;
  }
) {
  return describe("Daily stats model functions", () => {
    const prismaModel = getDailyStatsPrismaModel(modelName);

    describe("populate()", () => {
      async function assertAggregatedDays(datePeriod?: DatePeriodLike) {
        await prismaModel.populate(datePeriod);

        const statsDays = (
          await prismaModel.findMany({
            orderBy: {
              day: "asc",
            },
          })
        ).map(({ day }) => day);
        const nonDuplicateStatsDays = Array.from(
          new Set(
            statsDays
              .map((d) => d.toISOString())
              .sort((a, b) => a.localeCompare(b))
          )
        );
        const expectedAggregatedDays = getExpectedAggregatedDays(
          modelName,
          datePeriod ?? { from: MIN_DATE, to: new Date() }
        );

        expect(nonDuplicateStatsDays, "Days aggregated mismatch").toEqual(
          expectedAggregatedDays
        );
      }

      it("should fill in stats for a single day correctly", async () => {
        const dayPeriod: DatePeriodLike = {
          from: "2023-08-20",
          to: "2023-08-20",
        };

        await prismaModel.populate(dayPeriod);

        await assertStats(dayPeriod);
      });

      it("should fill in stats for several days correctly", async () => {
        const daysPeriod: DatePeriodLike = {
          from: "2023-08-24",
          to: "2023-09-01",
        };

        await prismaModel.populate(daysPeriod);

        await assertStats(daysPeriod);
      });

      describe("when filling in stats for a multiple days period", () => {
        it("should do it correctly when `YYYY-MM-DD` dates are passed", async () => {
          const dayPeriod: DatePeriodLike = {
            from: "2023-08-24",
            to: "2023-09-01",
          };

          await prismaModel.populate(dayPeriod);

          await assertAggregatedDays({
            from: "2023-08-24",
            to: "2023-09-01",
          });
        });
      });

      it("should fill in stats for a period when native `Date` objects are provided", async () => {
        await assertAggregatedDays({
          from: new Date("2023-08-24"),
          to: new Date("2023-09-01"),
        });
      });

      it("should fill in stats for a period when `dayjs` objects are provided", async () => {
        await assertAggregatedDays({
          from: dayjs("2023-08-24"),
          to: dayjs("2023-09-01"),
        });
      });

      it("should fill in stats for a period that doesn't have a starting date", async () => {
        await assertAggregatedDays({
          to: "2023-08-24",
        });
      });

      it("should fill in stats for a period that doesn't have an ending date", async () => {
        await assertAggregatedDays({
          from: "2023-08-24",
        });
      });

      it("should fill in stats up to current date if no period is specified", async () => {
        await assertAggregatedDays();
      });

      it("should fill in stats for a period with no data", async () => {
        await assertAggregatedDays({
          from: "2099-01-01",
          to: "2099-12-31",
        });
      });

      it("should ignore reorged blocks when aggregating stats", async () => {
        await indexBlock({ indexAsReorged: true });

        await assertAggregatedDays({
          from: "2023-09-01",
          to: "2023-09-01",
        });
      });
    });

    describe("deleteAll()", async () => {
      it("should delete all stats correctly", async () => {
        await prismaModel.populate({ from: "2022-01-01" });

        await prismaModel.deleteAll();

        const dailyStats = await prismaModel.findMany({
          orderBy: { day: "asc" },
        });

        expect(dailyStats).toHaveLength(0);
      });
    });
  });
}
