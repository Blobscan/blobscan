import type { Chain } from "@blobscan/chains";
import type { DayjsDatePeriod } from "@blobscan/dayjs";
import dayjs from "@blobscan/dayjs";
import type { Prisma } from "@blobscan/db";
import { Category, Rollup } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  commaSeparatedCategoriesSchema,
  commaSeparatedRollupsSchema,
  commaSeparatedValuesSchema,
  timeseriesMetricsSchema,
} from "../zod-schemas";

const METRIC_NAMES = Object.keys(timeseriesMetricsSchema.shape);

export const timeFrameSchema = z.enum([
  "1d",
  "7d",
  "15d",
  "30d",
  "90d",
  "180d",
  "365d",
  "All",
]);

export type TimeFrame = z.infer<typeof timeFrameSchema>;

export type DayStatFilter = {
  day: string | Date | Prisma.DateTimeFilter<"DailyStats">;
};

export type CategoryStatFilter = {
  category?: null | { not: null } | { in: Category[] };
};
export type RollupStatFilter = {
  rollup?: null | { not: null } | { in: Rollup[] };
};

export type StatsFilters = {
  select?: Prisma.DailyStatsSelect;
  where: Partial<
    DayStatFilter &
      CategoryStatFilter &
      RollupStatFilter & { OR: (CategoryStatFilter & RollupStatFilter)[] }
  >;
};

const allSchema = z.literal("all");

export const withTimeFrameFilterSchema = z.object({
  timeFrame: timeFrameSchema.optional(),
});

export const withStatCategoriesFilterSchema = z.object({
  categories: allSchema.or(commaSeparatedCategoriesSchema).optional(),
});

export const withStatRollupsFilterSchema = z.object({
  rollups: allSchema.or(commaSeparatedRollupsSchema).optional(),
});

export const withMetricsFilterSchema = z
  .object({
    metrics: commaSeparatedValuesSchema.transform((values, ctx) =>
      values?.map((v) => {
        const res = timeseriesMetricsSchema.keyof().safeParse(v);

        if (!res.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            params: {
              value: v,
            },
            message: "Provided metric name is invalid",
          });

          return z.NEVER;
        }

        return res.data;
      })
    ),
  })
  .partial();

export const withStatFiltersSchema = withMetricsFilterSchema
  .merge(withTimeFrameFilterSchema)
  .merge(withStatCategoriesFilterSchema.merge(withStatRollupsFilterSchema));

export type StatFiltersOutputSchema = z.output<typeof withStatFiltersSchema>;

function getRecommendedDaysInterval(
  { from, to }: Required<DayjsDatePeriod>,
  { categories, rollups, metrics }: StatFiltersOutputSchema
) {
  const days = to.diff(from, "day");
  const categoriesCount =
    categories === "all"
      ? Object.keys(Category).length
      : categories?.length ?? 0;
  const rollupsCount =
    rollups === "all" ? Object.keys(Rollup).length : rollups?.length ?? 0;
  const metricsCount = metrics?.length ?? METRIC_NAMES.length;
  const dimensionCount = categoriesCount * rollupsCount;

  const totalPotentialPoints = days * dimensionCount * metricsCount;

  if (totalPotentialPoints < 10_000) {
    return 1;
  }

  if (totalPotentialPoints < 30_000) {
    return 3;
  }

  if (totalPotentialPoints < 60_000) {
    return 4;
  }

  return 7;
}

function getSampleDates(
  { from, to }: Required<DayjsDatePeriod>,
  daysInterval: number
) {
  const dates: string[] = [];

  let current = from.clone();

  while (current.isBefore(to) || current.isSame(to)) {
    dates.push(current.utc().toISOString());

    current = current.add(daysInterval, "day");
  }

  return dates;
}

function buildDayWhereClause({
  chain,
  input,
}: {
  chain: Chain;
  input: StatFiltersOutputSchema;
}): DayStatFilter["day"] {
  let days: number;
  const to = dayjs().utc().subtract(1, "day").startOf("day");
  const toISO = to.utc().toISOString();
  const timeFrame = input.timeFrame;

  let from: dayjs.Dayjs;

  if (!timeFrame || timeFrame === "All") {
    const dencunFork = chain.forks[0];
    const dencunActivationDate = dayjs(dencunFork.activationDate);

    if (dencunActivationDate.isAfter(to)) {
      const dencunActivationDateISO = dencunActivationDate.utc().toISOString();
      return {
        gt: dencunActivationDateISO,
        lte: toISO,
      };
    }

    from = dencunActivationDate;

    days = from.diff(dencunActivationDate, "day");
  } else {
    days = parseInt(timeFrame.split("d")[0] ?? "1");
    from = to.subtract(days, "day").startOf("day");
  }

  if (from.isSame(to)) {
    return {
      gte: toISO,
      lte: toISO,
    };
  }

  const daysInterval = getRecommendedDaysInterval(
    {
      from,
      to,
    },
    input
  );
  const samplingRequired = daysInterval > 1;

  if (samplingRequired) {
    const sampleDates = getSampleDates(
      {
        from,
        to,
      },
      daysInterval
    );

    return {
      in: sampleDates,
    };
  }

  const fromISO = from.utc().toISOString();

  return {
    gt: fromISO,
    lte: toISO,
  };
}

export const withStatFilters = t.middleware(
  ({ next, input: input_ = {}, ctx: { chain } }) => {
    const input = input_ as StatFiltersOutputSchema;
    const { categories, rollups, metrics } = input;
    let select: StatsFilters["select"];
    const where: StatsFilters["where"] = {};

    if (metrics) {
      select = metrics.reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        { day: true, category: true, rollup: true }
      );
    }

    where.day = buildDayWhereClause({
      chain,
      input,
    });

    const isAllCategoriesEnabled = categories === "all";
    const isAllRollupsEnabled = rollups === "all";

    const categoryFilter: CategoryStatFilter = {
      category: categories
        ? isAllCategoriesEnabled
          ? {
              not: null,
            }
          : {
              in: categories,
            }
        : null,
    };
    const rollupFilter: RollupStatFilter = {
      rollup: rollups
        ? isAllRollupsEnabled
          ? {
              not: null,
            }
          : {
              in: rollups,
            }
        : null,
    };

    if (categories && rollups) {
      where.OR = [categoryFilter, rollupFilter];
    } else {
      where.category = categoryFilter.category;
      where.rollup = rollupFilter.rollup;
    }

    return next({
      ctx: {
        statFilters: {
          select,
          where,
        },
      },
    });
  }
);
