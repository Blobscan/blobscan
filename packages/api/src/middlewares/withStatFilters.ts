import type { Chain } from "@blobscan/chains";
import dayjs from "@blobscan/dayjs";
import type { Prisma } from "@blobscan/db";
import type { Category, Rollup } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import type { MetricsGranularity, TimeFrame } from "../time-frames";
import {
  getTimeFrameDays,
  getTimeFrameGranularity,
  timeFrameSchema,
} from "../time-frames";
import { t } from "../trpc-client";
import {
  commaSeparatedCategoriesSchema,
  commaSeparatedRollupsSchema,
  commaSeparatedValuesSchema,
  timeseriesMetricsSchema,
} from "../zod-schemas";

export type PeriodStartStatFilter = {
  periodStart: string | Date | Prisma.DateTimeFilter<"DailyMetrics">;
};

export type CategoryStatFilter = {
  category?: null | { not: null } | { in: Category[] };
};
export type RollupStatFilter = {
  rollup?: null | { not: null } | { in: Rollup[] };
};

// All the metrics tables have the same columns, so the filters use the types
// of the daily table.
export type StatsFilters = {
  granularity: MetricsGranularity;
  select?: Prisma.DailyMetricsSelect;
  where: Partial<
    PeriodStartStatFilter &
      CategoryStatFilter &
      RollupStatFilter & { OR: (CategoryStatFilter & RollupStatFilter)[] }
  >;
};

const allSchema = z.literal("all");

export const withTimeFrameFilterSchema = z.object({
  timeFrame: timeFrameSchema
    .optional()
    .describe(
      "The time frame of the stats. It also sets the length of each period: an hour for `1d` and `7d`, and a day for `15d`, `30d` and `90d`. For `180d`, `365d` and `All` (the default), the period is a day without `categories` and `rollups`, and a week with them."
    ),
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

/**
 * Returns the start of the period that contains the date, in UTC. A week
 * starts on Monday, the same as Postgres DATE_TRUNC('week', ...), which
 * Dagster uses to aggregate the weekly metrics.
 */
export function getPeriodStart(
  date: dayjs.ConfigType,
  granularity: MetricsGranularity
) {
  const utcDate = dayjs(date).utc();

  if (granularity === "week") {
    const startOfDay = utcDate.startOf("day");

    return startOfDay.subtract((startOfDay.day() + 6) % 7, "day");
  }

  return utcDate.startOf(granularity);
}

function buildPeriodStartWhereClause({
  chain,
  timeFrame,
  granularity,
}: {
  chain: Chain;
  timeFrame?: TimeFrame;
  granularity: MetricsGranularity;
}): PeriodStartStatFilter["periodStart"] {
  // The current period is not complete. getTimeseries adds it when it is
  // requested.
  const lastClosedPeriodStart = getPeriodStart(dayjs(), granularity).subtract(
    1,
    granularity
  );
  const lte = lastClosedPeriodStart.toISOString();

  if (!timeFrame || timeFrame === "All") {
    const dencunFork = chain.forks[0];

    return {
      gte: getPeriodStart(dencunFork.activationDate, granularity).toISOString(),
      lte,
    };
  }

  // The periods that start in the time frame, before the current period.
  const days = getTimeFrameDays(timeFrame);
  const currentPeriodStart = lastClosedPeriodStart.add(1, granularity);

  return {
    gte: currentPeriodStart.subtract(days, "day").toISOString(),
    lte,
  };
}

export const withStatFilters = t.middleware(
  ({ next, input: input_ = {}, ctx: { chain } }) => {
    const input = input_ as StatFiltersOutputSchema;
    const { categories, rollups, metrics, timeFrame } = input;
    const granularity = getTimeFrameGranularity(timeFrame, {
      isCategorized: Boolean(categories || rollups),
    });
    let select: StatsFilters["select"];
    const where: StatsFilters["where"] = {};

    if (metrics) {
      select = metrics.reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        { periodStart: true, category: true, rollup: true }
      );
    }

    where.periodStart = buildPeriodStartWhereClause({
      chain,
      timeFrame,
      granularity,
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
          granularity,
          select,
          where,
        },
      },
    });
  }
);
