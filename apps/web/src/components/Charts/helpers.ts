import type {
  Arrayified,
  Category,
  DailyStats,
  Rollup,
  Stringified,
} from "~/types";
import { arrayfy, stringify } from "~/utils";

type CategoryName = Category | Rollup | "total" | "unknown";

type ChartStatsSeries<T extends DailyStats> = {
  [K in keyof Omit<T, "category" | "rollup" | "day">]: {
    name?: CategoryName;
    values: Stringified<T[K]>[];
  }[];
};

type EChartCompliantStats<T extends DailyStats> = Stringified<
  Arrayified<Omit<T, "day" | "category" | "rollup">>
>;

export function convertStatsToChartSeries<T extends DailyStats>(
  dailyStats: T[]
):
  | {
      days: string[];
      series?: ChartStatsSeries<T>;
      totalSeries?: EChartCompliantStats<T>;
      totalRollupSeries?: EChartCompliantStats<T>;
    }
  | undefined {
  if (dailyStats.length === 0) {
    return { days: [] };
  }

  const days = Array.from(new Set(dailyStats.map(({ day }) => day.toString())));

  const groupedStats = Object.groupBy(
    dailyStats,
    ({ category, rollup }): CategoryName => {
      if (!category && !rollup) return "total";
      return category ?? rollup ?? "unknown";
    }
  );

  const { total, rollup, ...groupedCategories } = groupedStats;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const baseStatKeys = Object.keys(dailyStats[0]!).filter(
    (key) => !["day", "category", "rollup"].includes(key)
  ) as (keyof Omit<T, "day" | "category" | "rollup">)[];

  const allSeries = Object.entries(groupedCategories).map(
    ([name, entries]) => ({
      name: name as CategoryName,
      values: arrayfy(
        stringify(entries as Omit<DailyStats, "day" | "category" | "rollup">[])
      ),
    })
  );

  const series = baseStatKeys.reduce<ChartStatsSeries<T>>((acc, key) => {
    acc[key] = allSeries.map(({ name, values }) => ({
      name,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      values: values[key],
    }));
    return acc;
  }, {} as ChartStatsSeries<T>);

  const cleanedTotal = total?.map(
    ({ day: _, category: __, rollup: ___, ...rest }) => stringify(rest)
  );
  const cleanedRollup = rollup?.map(
    ({ day: _, category: __, rollup: ___, ...rest }) => stringify(rest)
  );

  const totalSeries =
    cleanedTotal && typeof cleanedTotal !== "string"
      ? (arrayfy(
          cleanedTotal as Record<string, unknown>[]
        ) as EChartCompliantStats<T>)
      : undefined;
  const totalRollupSeries = cleanedRollup
    ? (arrayfy(
        stringify(cleanedRollup) as Record<string, unknown>[]
      ) as EChartCompliantStats<T>)
    : undefined;

  return {
    days,
    series,
    totalSeries,
    totalRollupSeries,
  };
}
