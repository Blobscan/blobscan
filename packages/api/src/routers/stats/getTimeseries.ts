import { Prisma } from "@blobscan/db";
import { Rollup } from "@blobscan/db/prisma/enums";
import { Category } from "@blobscan/db/prisma/enums";
import { DailyStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { withSortFilterSchema } from "../../middlewares/withFilters";
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
} from "../../zod-schemas";
import { buildStatsPath } from "./helpers";

const metricsSchema = DailyStatsModel.omit({
  id: true,
  day: true,
  category: true,
  rollup: true,
});
const METRICS = Object.keys(metricsSchema.shape);

const inputSchema = withStatFiltersSchema.merge(withSortFilterSchema);

const metricSeriesSchema = z.object(arrayOptionalizeShape(metricsSchema.shape));

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
    }),
  })
  .transform(normalize);

type OutputSchema = z.input<typeof outputSchema>;

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
}: z.output<typeof inputSchema>): OutputSchema {
  const output: OutputSchema = {
    data: {
      timestamps: [],
      series: [],
    },
  };

  const requestedCategories =
    categories === "all" ? Object.values(Category) : categories;
  const requestedRollups = rollups === "all" ? Object.values(Rollup) : rollups;
  const requestedMetrics = stats ?? METRICS;

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
    id: dimension.name ?? "global",
  };
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
  .query(
    cacheTRPCQuery(
      async ({ ctx: { prisma, statFilters }, input }) => {
        const dailyStats = await prisma.dailyStats.findMany({
          select: statFilters.select,
          where: statFilters.where,
          orderBy: [
            {
              day: input.sort,
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
          output.data.series.map(({ dimension: { type, name } }, i) => [
            name ?? type,
            i,
          ])
        );
        const timestamps = new Set<string>();

        for (const stats of dailyStats) {
          const currTimestamp = stats.day;

          if (!timestamps.has(currTimestamp.toUTCString())) {
            timestamps.add(currTimestamp.toUTCString());

            output.data.timestamps.push(currTimestamp);
          }

          const currTimestampIdx = output.data.timestamps.length - 1;

          const {
            dimension: { type, name },
            id: seriesId,
          } = getSeriesInfo(stats);
          const timeSeriesIdx = seriesToIdx.get(seriesId);

          if (timeSeriesIdx === undefined) {
            throw new Error(
              `Series of type ${type} and name ${name} not found`
            );
          }

          const currTimeseries = output.data.series[timeSeriesIdx];

          if (currTimeseries === undefined) {
            throw new Error(
              `Series of type ${type} and name ${name} not found`
            );
          }

          if (currTimeseries.startTimestampIdx === undefined) {
            currTimeseries.startTimestampIdx = currTimestampIdx;
          }

          for (const [metricName, metricValue] of Object.entries(stats)) {
            const skippableFields = ["day", "category", "rollup", "id"];
            const allowedMetricTypes = ["number", "bigint"];

            if (
              skippableFields.includes(metricName) &&
              !allowedMetricTypes.includes(typeof metricValue) &&
              !Prisma.Decimal.isDecimal(metricValue)
            ) {
              continue;
            }

            const metricName_ = metricName as keyof MetricsSeriesSchema;
            const timeseriesMetric = currTimeseries.metrics[metricName_];

            if (!timeseriesMetric) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currTimeseries.metrics[metricName_] = [metricValue] as any;
            } else {
              const gap =
                currTimestampIdx -
                (timeseriesMetric.length + currTimeseries.startTimestampIdx);

              if (gap > 0) {
                for (let i = 0; i < gap; i++) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (timeseriesMetric as any[]).push(getZeroValue(metricValue));
                }
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (timeseriesMetric as any[]).push(metricValue);
            }
          }
        }

        return output;
      },
      {
        queryName: "getTimeseries",
        ttl: "daily",
      }
    )
  );
