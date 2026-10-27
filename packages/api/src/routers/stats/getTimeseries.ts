import dayjs from "@blobscan/dayjs";
import { Prisma } from "@blobscan/db";
import { Rollup } from "@blobscan/db/prisma/enums";
import { Category } from "@blobscan/db/prisma/enums";
import { booleanSchema, z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { withSortFilterSchema } from "../../middlewares/withFilters";
import type { StatsFilters } from "../../middlewares/withStatFilters";
import {
  withStatFiltersSchema,
  withStatFilters,
} from "../../middlewares/withStatFilters";
import { publicProcedure } from "../../procedures";
import { normalize, cacheTRPCQuery } from "../../utils";
import type { Dimension } from "../../zod-schemas";
import {
  arrayOptionalizeShape,
  dimensionSchema,
  getDimension,
  timeseriesMetricsSchema,
} from "../../zod-schemas";
import { buildStatsPath } from "./helpers";

const METRIC_NAMES = Object.keys(timeseriesMetricsSchema.shape);

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
      timestamps: z.date().array(),
      series: timeseriesSchema.array(),
      currentPeriod: z
        .object({
          timestamp: z.date(),
          updatedAt: z.date().optional(),
        })
        .optional()
        .describe(
          "The current period, when `includeCurrentPeriod` is set and the period has data. Its values are partial."
        ),
    }),
  })
  .transform(normalize);

type OutputSchema = z.input<typeof outputSchema>;

type MetricsRow = Record<string, unknown> & {
  category: Category | null;
  rollup: Rollup | null;
};

const NON_METRIC_FIELDS = ["periodStart", "category", "rollup", "id"];

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

function createOutput({
  categories,
  rollups,
  metrics: stats,
}: InputSchema): OutputSchema {
  const output: OutputSchema = {
    data: {
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
  return Object.entries(row).filter(
    ([field]) => !NON_METRIC_FIELDS.includes(field)
  ) as [keyof MetricsSeriesSchema, unknown][];
}

function getZeroValue(value: unknown) {
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
 * The `gap` periods between the value and the other values get zeros.
 */
function addMetricValue(
  values: unknown[],
  value: unknown,
  { gap, position }: { gap: number; position: "end" | "start" }
) {
  const zeros = Array<unknown>(Math.max(gap, 0)).fill(getZeroValue(value));

  if (position === "end") {
    values.push(...zeros, value);
  } else {
    values.unshift(value, ...zeros);
  }
}

type TimeseriesContext = TRPCContext & { statFilters: StatsFilters };

type ClosedPeriodsInput = Omit<InputSchema, "includeCurrentPeriod">;

async function buildClosedPeriodsTimeseries({
  ctx: { prisma, statFilters },
  input,
}: {
  ctx: TimeseriesContext;
  input: ClosedPeriodsInput;
}): Promise<OutputSchema> {
  const dailyMetrics = await prisma.dailyMetrics.findMany({
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

  const output = createOutput(input);
  const seriesToIdx = new Map<string, number>(
    output.data.series.map(({ dimension }, i) => [getSeriesId(dimension), i])
  );
  const timestamps = new Set<string>();

  for (const stats of dailyMetrics) {
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

// The closed periods do not change during the day, so they are cached until
// the end of the day.
const getClosedPeriodsTimeseries = cacheTRPCQuery(
  buildClosedPeriodsTimeseries,
  {
    queryName: "getTimeseries",
    ttl: "daily",
  }
);

/**
 * Returns true when the closed periods do not include the last closed period.
 * The daily cache stays for 5 minutes after the end of the day, so a cached
 * timeseries can end one day before the current period.
 *
 * A sampled timeseries (see withStatFilters) has no data for all days, so it
 * always returns false.
 */
function isLastClosedPeriodMissing(
  { data: { timestamps } }: OutputSchema,
  {
    statFilters,
    sort,
    currentPeriodStart,
  }: {
    statFilters: StatsFilters;
    sort: Prisma.SortOrder;
    currentPeriodStart: Date;
  }
) {
  const periodStartFilter = statFilters.where.periodStart;
  const isSampled =
    typeof periodStartFilter === "object" &&
    !(periodStartFilter instanceof Date) &&
    "in" in periodStartFilter;
  const latestTimestamp = sort === "asc" ? timestamps.at(-1) : timestamps[0];

  if (isSampled || !latestTimestamp) {
    return false;
  }

  const lastClosedPeriodStart = dayjs(currentPeriodStart).subtract(1, "day");

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
    prisma.dailyMetrics.findMany({
      select: statFilters.select,
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
 * zeros, the same as the gaps between closed periods.
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
              [metricName, getZeroValue(values?.[0])] as const
          );

    for (const [metricName, metricValue] of metricEntries) {
      const values = (currSeries.metrics[metricName] ?? []) as unknown[];

      // For a descending sort, the current period moves the closed periods
      // one index forward. The periods before the first period of the series
      // get zeros.
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

  output.data.currentPeriod = { timestamp };

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

    let output = await getClosedPeriodsTimeseries({
      ctx,
      input: closedPeriodsInput,
    });

    if (!includeCurrentPeriod) {
      return output;
    }

    const currentPeriodStart = dayjs().utc().startOf("day").toDate();

    // Without the last closed period, the chart would skip a day before the
    // current period. Read the closed periods from the database again.
    if (
      isLastClosedPeriodMissing(output, {
        statFilters: ctx.statFilters,
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
