import type { ReactNode } from "react";

import { useQueryParams } from "~/hooks/useQueryParams";
import { useTimeseries } from "~/hooks/useTimeseries";
import type {
  TimeseriesChartComponent,
  TimeseriesChartProps,
} from "./Charts/ChartBase/types";
import { FiltersBar } from "./FiltersBar";
import { Header } from "./Header";

export type MetricChartPageProps<P extends TimeseriesChartProps> = {
  chart: TimeseriesChartComponent<P>;
  description: ReactNode;
  enableFilters?: boolean;
  title: ReactNode;
};

export const TimeseriesChartPage = function <P extends TimeseriesChartProps>({
  chart: Chart,
  title,
  description,
  enableFilters,
}: MetricChartPageProps<P>) {
  const {
    filterParams: { category, rollups },
    isReady,
  } = useQueryParams();
  const filtersSet = !!category || !!rollups?.length;
  const itemCount = filtersSet
    ? (category ? 1 : 0) + (rollups?.length ?? 0)
    : undefined;

  const { data: chartDatasets, isLoading } = useTimeseries(
    Chart.requiredMetrics
  );

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <Header>{title}</Header>
      <div>{description}</div>
      {enableFilters && <FiltersBar hideRangeFilter hideSortFilter />}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Chart
        dataset={chartDatasets}
        isLoading={isLoading}
        size="2xl"
        skeletonOpts={{
          chart: {
            timeframe: filtersSet ? "All" : "180d",
          },
          legend: {
            itemCount,
          },
        }}
      />
    </div>
  );
};
