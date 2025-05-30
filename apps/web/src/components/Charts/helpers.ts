import type { Category, DailyStats, Rollup, Stringified } from "~/types";
import { normalizeNumerish } from "../../utils";

type CategoryName = Category | Rollup | "total" | "unknown";

type ChartStatsSeries<T extends DailyStats> = {
  [K in keyof Omit<T, "category" | "rollup" | "day">]: {
    name?: CategoryName;
    values: Stringified<T[K]>[];
  }[];
};

export function convertStatsToChartSeries<T extends DailyStats>(
  dailyStats: T[]
):
  | {
      days: string[];
      series?: ChartStatsSeries<T>;
      totalSeries?: ChartStatsSeries<T>;
      totalRollupSeries?: ChartStatsSeries<T>;
    }
  | undefined {
  if (dailyStats.length === 0) {
    return { days: [] };
  }

  const days = Array.from(new Set(dailyStats.map(({ day }) => day.toString())));
  const totalSeries: ChartStatsSeries<T> = {} as ChartStatsSeries<T>;
  const totalRollupSeries: ChartStatsSeries<T> = {} as ChartStatsSeries<T>;
  const categoriesSeries: ChartStatsSeries<T> = {} as ChartStatsSeries<T>;
  let currentDayIndex = 0;
  let prevDay = days[0];

  for (const stats of dailyStats) {
    const day = stats.day.toString();
    const seriesName = stats.category ?? stats.rollup ?? "total";

    if (day !== prevDay) {
      prevDay = day;
      currentDayIndex++;
    }

    Object.entries(stats).forEach(([statKey, statValue]) => {
      if (statKey === "day" || statKey === "category" || statKey === "rollup") {
        return;
      }

      const defaultStatValue = typeof statValue === "number" ? 0 : "0";

      const statKey_ = statKey as keyof ChartStatsSeries<T>;
      const series =
        seriesName === "total"
          ? totalSeries
          : seriesName === "rollup"
          ? totalRollupSeries
          : categoriesSeries;

      if (!series[statKey_]) {
        series[statKey_] = [];
      }

      const statSeries = series[statKey_];
      const categoryStat = statSeries.find(({ name }) => name === seriesName);
      const statValue_ = (
        typeof statValue !== "number" ? String(statValue) : statValue
      ) as Stringified<T[typeof statKey_]>;

      if (!categoryStat) {
        const values = Array.from({ length: days.length }).fill(
          defaultStatValue
        ) as Stringified<T[typeof statKey_]>[];

        values[currentDayIndex] = statValue_;

        statSeries.push({
          name: seriesName,
          values,
        });
      } else {
        categoryStat.values[currentDayIndex] = statValue_;
      }
    });
  }

  return {
    days,
    series: categoriesSeries,
    totalSeries,
    totalRollupSeries,
  };
}

type AggregationType = "count" | "average" | "time";

export function aggregateValues(
  values: number[] | string[],
  type: AggregationType
): number {
  if (!values.length) {
    return 0;
  }

  const normalizedValues = values.map((v) => Number(v));

  switch (type) {
    case "count": {
      return normalizedValues.reduce((acc, value) => acc + value, 0);
    }
    case "average": {
      const total = normalizedValues.reduce((acc, value) => acc + value, 0);
      return total / values.length;
    }
    default:
      throw new Error(`Aggregation type "${type}" not supported`);
  }
}

export function aggregateSeries(
  series: { name?: string; values: number[] }[],
  type: AggregationType
): number[];
export function aggregateSeries(
  series: { name?: string; values: string[] }[],
  type: AggregationType
): string[];
export function aggregateSeries<T extends number | string | bigint>(
  series: {
    name?: string;
    values: T[];
  }[],
  type: AggregationType
): T[] {
  return series.reduce((acc, { values }) => {
    return values.map((v, i) => {
      const value = normalizeNumerish(v);
      const zero = typeof value === "bigint" ? BigInt(0) : 0;
      const accValue = acc[i] ? normalizeNumerish(acc[i]) : zero;

      if (accValue === zero) {
        return v as T;
      }

      if (type === "average") {
        if (typeof value === "bigint") {
          return (
            ((accValue as bigint) + (value as bigint)) /
            BigInt(2)
          ).toString() as T;
        }

        return (((accValue as number) + (value as number)) / 2) as T;
      }

      if (typeof value === "bigint") {
        return ((accValue as bigint) + (value as bigint)).toString() as T;
      }

      return ((accValue as number) + (value as number)) as T;
    });
  }, [] as T[]);
}
