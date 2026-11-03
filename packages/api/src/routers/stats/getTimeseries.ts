import dayjs from "@blobscan/dayjs";
import { Prisma } from "@blobscan/db";
import { Rollup } from "@blobscan/db/prisma/enums";
import { Category } from "@blobscan/db/prisma/enums";
import { booleanSchema, z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { withSortFilterSchema } from "../../middlewares/withFilters";
import type { StatsFilters } from "../../middlewares/withStatFilters";
import {
  getPeriodStart,
  withStatFiltersSchema,
  withStatFilters,
} from "../../middlewares/withStatFilters";
import { publicProcedure } from "../../procedures";
import type { MetricsGranularity } from "../../time-frames";
import { metricsGranularitySchema } from "../../time-frames";
import { normalize, cacheTRPCQuery } from "../../utils";
import type { CacheTTL } from "../../utils/cache";
import type { Dimension } from "../../zod-schemas";
import {
  arrayOptionalizeShape,
  dimensionSchema,
  getDimension,
  timeseriesMetricsSchema,
} from "../../zod-schemas";
import { buildStatsPath } from "./helpers";

const METRIC_NAMES = Object.keys(timeseriesMetricsSchema.shape);
// timeseriesMetricsSchema omits the fields of a row that are not metrics, for
// example periodStart and updatedAt.
const METRIC_NAME_SET = new Set(METRIC_NAMES);

const inputSchema = withStatFiltersSchema.merge(withSortFilterSchema).merge(
  z.object({
    // Do not use z.boolean() here. The OpenAPI adapter changes a z.boolean()
    // query value with Boolean(), and "false" then becomes true.
    includeCurrentPeriod: booleanSchema
      .describe(
        "Include the current period, which is not complete yet. Its values are partial, and the response gives its timestamp in `currentPeriod`."
      )
      .optional(),
  })
);

type InputSchema = z.output<typeof inputSchema>;

const metricSeriesSchema = z.object(
  arrayOptionalizeShape(timeseriesMetricsSchema.shape)
);

const timeseriesSchema = z.object({
  dimension: dimensionSchema,
  startTimestampIdx: z.number().optional(),
  metrics: metricSeriesSchema,
});

type TimeseriesSchema = z.infer<typeof timeseriesSchema>;
type MetricsSeriesSchema = z.input<typeof metricSeriesSchema>;

export const outputSchema = z
  .object({
    data: z.object({
      granularity: metricsGranularitySchema.describe(
        "The length of each period. Each timestamp is the start of a period."
      ),
      timestamps: z.date().array(),
      series: timeseriesSchema.array(),
      currentPeriod: z
        .object({
          timestamp: z.date(),
          updatedAt: z.date().optional(),
        })
        .optional()
        .describe(
          "The current period, when `includeCurrentPeriod` is set and the period has data. Its values are partial. `updatedAt` is the time of the last update of its values."
        ),
    }),
  })
  .transform(normalize);

type OutputSchema = z.input<typeof outputSchema>;

type MetricsRow = Record<string, unknown> & {
  category: Category | null;
  rollup: Rollup | null;
};

// The current period cache is short because Dagster updates the current
// period every 10 minutes.
const CURRENT_PERIOD_CACHE_TTL_SECONDS = 60;

function createTimeseries(
  dimension: Dimension,
  metricNames: string[]
): TimeseriesSchema {
  return {
    dimension,
    metrics: metricNames.reduce((acc, metric) => {
      acc[metric as keyof MetricsSeriesSchema] = [];
      return acc;
    }, {} as MetricsSeriesSchema),
  };
}

function createOutput(
  { categories, rollups, metrics: stats }: InputSchema,
  granularity: MetricsGranularity
): OutputSchema {
  const output: OutputSchema = {
    data: {
      granularity,
      timestamps: [],
      series: [],
    },
  };

  const requestedCategories =
    categories === "all" ? Object.values(Category) : categories;
  const requestedRollups = rollups === "all" ? Object.values(Rollup) : rollups;
  const requestedMetrics = stats ?? METRIC_NAMES;

  if (requestedCategories) {
    output.data.series.push(
      ...requestedCategories.map((c) =>
        createTimeseries(
          {
            type: "category",
            name: c,
          },
          requestedMetrics
        )
      )
    );
  }

  if (requestedRollups) {
    output.data.series.push(
      ...requestedRollups.map((r) =>
        createTimeseries({ type: "rollup", name: r }, requestedMetrics)
      )
    );
  }

  if (!requestedCategories && !requestedRollups) {
    output.data.series.push(
      createTimeseries({ type: "global" }, requestedMetrics)
    );
  }

  return output;
}

function getSeriesId(dimension: Dimension) {
  return dimension.type !== "global"
    ? `${dimension.type}-${dimension.name}`
    : "global";
}

function getSeriesInfo({
  category,
  rollup,
}: {
  category: Category | null;
  rollup: Rollup | null;
}) {
  const dimension = getDimension(category, rollup);

  return {
    dimension,
    id: getSeriesId(dimension),
  };
}

function getMetricEntries(row: Record<string, unknown>) {
  return Object.entries(row).filter(([field]) =>
    METRIC_NAME_SET.has(field)
  ) as [keyof MetricsSeriesSchema, unknown][];
}

/**
 * Returns the value of a period with no row: zero, or null for a metric that
 * the series does not have.
 */
function getGapValue(value: unknown) {
  // A metric with no value in a row (for example, a global-only metric in a
  // rollup row) has no value in the gaps either.
  if (value === null || value === undefined) {
    return null;
  }
  if (Prisma.Decimal.isDecimal(value)) {
    return new Prisma.Decimal(0);
  }
  if (typeof value === "bigint") {
    return BigInt(0);
  }
  return 0;
}

/**
 * Adds a metric value to the end or to the start of the values of a series.
 * The `gap` periods between the value and the other values get the gap
 * value of the metric (see getGapValue).
 */
function addMetricValue(
  values: unknown[],
  value: unknown,
  { gap, position }: { gap: number; position: "end" | "start" }
) {
  const gapValues = Array<unknown>(Math.max(gap, 0)).fill(getGapValue(value));

  if (position === "end") {
    values.push(...gapValues, value);
  } else {
    values.unshift(value, ...gapValues);
  }
}

type TimeseriesContext = TRPCContext & { statFilters: StatsFilters };

type IsSameType<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

/**
 * Returns the metrics table of the granularity. All the metrics tables have
 * the same columns, so the function gives the type of the daily table for all
 * of them.
 */
function getMetricsTable(
  prisma: TRPCContext["prisma"],
  granularity: MetricsGranularity
) {
  // The casts are safe only while the tables have the same columns. When the
  // columns change, this line fails the type check.
  const tablesHaveSameColumns: IsSameType<
    Prisma.HourlyMetricsGetPayload<object>,
    Prisma.DailyMetricsGetPayload<object>
  > &
    IsSameType<
      Prisma.WeeklyMetricsGetPayload<object>,
      Prisma.DailyMetricsGetPayload<object>
    > = true;

  void tablesHaveSameColumns;

  switch (granularity) {
    case "hour":
      return prisma.hourlyMetrics as unknown as typeof prisma.dailyMetrics;
    case "day":
      return prisma.dailyMetrics;
    case "week":
      return prisma.weeklyMetrics as unknown as typeof prisma.dailyMetrics;
  }
}

type ClosedPeriodsInput = Omit<InputSchema, "includeCurrentPeriod">;

async function buildClosedPeriodsTimeseries({
  ctx: { prisma, statFilters },
  input,
}: {
  ctx: TimeseriesContext;
  input: ClosedPeriodsInput;
}): Promise<OutputSchema> {
  const metricsRows = await getMetricsTable(
    prisma,
    statFilters.granularity
  ).findMany({
    select: statFilters.select,
    where: statFilters.where,
    orderBy: [
      {
        periodStart: input.sort,
      },
      {
        category: "asc",
      },
      {
        rollup: "asc",
      },
    ],
  });

  const output = createOutput(input, statFilters.granularity);
  const seriesToIdx = new Map<string, number>(
    output.data.series.map(({ dimension }, i) => [getSeriesId(dimension), i])
  );
  const timestamps = new Set<string>();

  for (const stats of metricsRows) {
    const currTimestamp = stats.periodStart;

    if (!timestamps.has(currTimestamp.toUTCString())) {
      timestamps.add(currTimestamp.toUTCString());

      output.data.timestamps.push(currTimestamp);
    }

    const currTimestampIdx = output.data.timestamps.length - 1;

    const { id: seriesId } = getSeriesInfo(stats);
    const timeseriesIdx = seriesToIdx.get(seriesId);

    if (timeseriesIdx === undefined) {
      throw new Error(`Timeseries with id ${seriesId} not found`);
    }

    const currTimeseries = output.data.series[timeseriesIdx];

    if (currTimeseries === undefined) {
      throw new Error(`Timeseries with id ${seriesId} not found`);
    }

    if (currTimeseries.startTimestampIdx === undefined) {
      currTimeseries.startTimestampIdx = currTimestampIdx;
    }

    for (const [metricName, metricValue] of getMetricEntries(stats)) {
      const timeseriesMetric = currTimeseries.metrics[metricName];

      if (!timeseriesMetric) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currTimeseries.metrics[metricName] = [metricValue] as any;
      } else {
        addMetricValue(timeseriesMetric as unknown[], metricValue, {
          gap:
            currTimestampIdx -
            (timeseriesMetric.length + currTimeseries.startTimestampIdx),
          position: "end",
        });
      }
    }
  }

  return output;
}

function cacheClosedPeriodsTimeseries(ttl: CacheTTL) {
  return cacheTRPCQuery(buildClosedPeriodsTimeseries, {
    queryName: "getTimeseries",
    ttl,
  });
}

// A new closed period comes at the end of each period, so the cache keeps the
// closed periods until then. The weekly periods use the daily cache, so the
// API reads them again each day. isLastClosedPeriodMissing uses the week
// length, so the result is correct. The time frame is in the cache key, so
// the granularities do not share cache entries.
const closedPeriodsTimeseriesGetters = {
  hour: cacheClosedPeriodsTimeseries("hourly"),
  day: cacheClosedPeriodsTimeseries("daily"),
  week: cacheClosedPeriodsTimeseries("daily"),
} satisfies Record<MetricsGranularity, unknown>;

/**
 * Returns true when the closed periods do not include the last closed period.
 * The cache stays for 5 minutes after the end of its period, so a cached
 * timeseries can end one period before the current period.
 */
function isLastClosedPeriodMissing(
  { data: { timestamps, granularity } }: OutputSchema,
  {
    sort,
    currentPeriodStart,
  }: {
    sort: Prisma.SortOrder;
    currentPeriodStart: Date;
  }
) {
  const latestTimestamp = sort === "asc" ? timestamps.at(-1) : timestamps[0];

  if (!latestTimestamp) {
    return false;
  }

  const lastClosedPeriodStart = dayjs(currentPeriodStart).subtract(
    1,
    granularity
  );

  return dayjs(latestTimestamp).isBefore(lastClosedPeriodStart);
}

// The period start is in the input, so the cache key changes when a new
// period starts.
const getCurrentPeriodRows = cacheTRPCQuery(
  async ({
    ctx: { prisma, statFilters },
    input: { periodStart },
  }: {
    ctx: TimeseriesContext;
    input: ClosedPeriodsInput & { periodStart: Date };
  }): Promise<MetricsRow[]> =>
    getMetricsTable(prisma, statFilters.granularity).findMany({
      // The update time of the current period is not a metric, so the metrics
      // filter does not select it.
      select: statFilters.select && { ...statFilters.select, updatedAt: true },
      where: {
        ...statFilters.where,
        periodStart,
      },
    }),
  {
    queryName: "getTimeseriesCurrentPeriod",
    ttl: CURRENT_PERIOD_CACHE_TTL_SECONDS,
  }
);

/**
 * Adds the current period to the closed periods timeseries. The current
 * period is the last timestamp for an ascending sort and the first timestamp
 * for a descending sort.
 *
 * A series that has data before the current period but no data in it gets
 * gap values, the same as the gaps between closed periods.
 */
function addCurrentPeriod(
  output: OutputSchema,
  {
    rows,
    timestamp,
    sort,
  }: { rows: MetricsRow[]; timestamp: Date; sort: Prisma.SortOrder }
): OutputSchema {
  // Do not add a period that has no data yet. For example, a period that
  // started a few minutes ago.
  if (!rows.length) {
    return output;
  }

  const { timestamps, series } = output.data;
  const rowsBySeriesId = new Map(
    rows.map((row) => [getSeriesInfo(row).id, row])
  );
  const isAscending = sort === "asc";
  const currentIdx = isAscending ? timestamps.length : 0;

  for (const currSeries of series) {
    const row = rowsBySeriesId.get(getSeriesId(currSeries.dimension));
    const { startTimestampIdx } = currSeries;

    if (startTimestampIdx === undefined) {
      if (row) {
        currSeries.startTimestampIdx = currentIdx;

        for (const [metricName, metricValue] of getMetricEntries(row)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currSeries.metrics[metricName] = [metricValue] as any;
        }
      }

      continue;
    }

    const metricEntries = row
      ? getMetricEntries(row)
      : (
          Object.entries(currSeries.metrics) as [
            keyof MetricsSeriesSchema,
            unknown[] | undefined
          ][]
        )
          .filter(([, values]) => values?.length)
          .map(
            ([metricName, values]) =>
              [
                metricName,
                getGapValue(values?.find((v) => v !== null && v !== undefined)),
              ] as const
          );

    for (const [metricName, metricValue] of metricEntries) {
      const values = (currSeries.metrics[metricName] ?? []) as unknown[];

      // For a descending sort, the current period moves the closed periods
      // one index forward. The periods before the first period of the series
      // get gap values.
      addMetricValue(values, metricValue, {
        gap: isAscending
          ? currentIdx - (startTimestampIdx + values.length)
          : startTimestampIdx,
        position: isAscending ? "end" : "start",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currSeries.metrics[metricName] = values as any;
    }

    if (!isAscending) {
      currSeries.startTimestampIdx = 0;
    }
  }

  if (isAscending) {
    timestamps.push(timestamp);
  } else {
    timestamps.unshift(timestamp);
  }

  // Dagster updates the rows of a period together, but each row has its own
  // update time. The latest one is the time of the last update.
  const updatedAt = rows.reduce<Date | undefined>(
    (latest, { updatedAt }) =>
      updatedAt instanceof Date && (!latest || updatedAt > latest)
        ? updatedAt
        : latest,
    undefined
  );

  output.data.currentPeriod = { timestamp, updatedAt };

  return output;
}

export const getTimeseries = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: buildStatsPath("timeseries"),
      tags: ["stats"],
      summary: "retrieves time series stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .use(withStatFilters)
  .query(async ({ ctx, input }) => {
    const { includeCurrentPeriod, ...closedPeriodsInput } = input;

    const { granularity } = ctx.statFilters;

    let output = await closedPeriodsTimeseriesGetters[granularity]({
      ctx,
      input: closedPeriodsInput,
    });

    if (!includeCurrentPeriod) {
      return output;
    }

    const currentPeriodStart = getPeriodStart(dayjs(), granularity).toDate();

    // Without the last closed period, the chart would skip a period before
    // the current period. Read the closed periods from the database again.
    if (
      isLastClosedPeriodMissing(output, {
        sort: input.sort,
        currentPeriodStart,
      })
    ) {
      output = await buildClosedPeriodsTimeseries({
        ctx,
        input: closedPeriodsInput,
      });
    }
    const currentPeriodRows = await getCurrentPeriodRows({
      ctx,
      input: { ...closedPeriodsInput, periodStart: currentPeriodStart },
    });

    return addCurrentPeriod(output, {
      rows: currentPeriodRows,
      timestamp: currentPeriodStart,
      sort: input.sort,
    });
  });
