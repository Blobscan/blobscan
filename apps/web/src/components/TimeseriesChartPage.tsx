import type { ReactNode } from "react";

import { useQueryParams } from "~/hooks/useQueryParams";
import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import type { TimeseriesChartComponent } from "./Charts/TimeseriesChartBase";
import { FiltersBar } from "./FiltersBar";
import { Header } from "./Header";

export type TimeseriesChartPageProps = {
  chart: TimeseriesChartComponent;
  description: ReactNode;
  enableFilters?: boolean;
  title: ReactNode;
  onlyGlobalTimeseries?: boolean;
};

export const TimeseriesChartPage = function ({
  chart: Chart,
  title,
  description,
  enableFilters,
  onlyGlobalTimeseries,
}: TimeseriesChartPageProps) {
  const {
    filterParams: { category, rollups },
    isReady,
  } = useQueryParams();
  const filtersSet = !!category || !!rollups?.length;
  const itemCount = filtersSet
    ? (category ? 1 : 0) + (rollups?.length ?? 0)
    : undefined;

  const { data: chartDatasets, isLoading } = useTimeseriesQuery(
    {
      metrics: Chart.requiredMetrics,
    },
    {
      onlyGlobal: onlyGlobalTimeseries,
    }
  );

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <Header>{title}</Header>
      <div>{description}</div>
      {enableFilters && <FiltersBar hideRangeFilter hideSortFilter />}
      <Chart
        dataset={chartDatasets}
        isLoading={isLoading}
        size="2xl"
        skeletonOpts={{
          chart: {
            itemCount: filtersSet ? 720 : 180,
          },
          legend: itemCount
            ? {
                itemCount,
              }
            : undefined,
        }}
      />
    </div>
  );
};
