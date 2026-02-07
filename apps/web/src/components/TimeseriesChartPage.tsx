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
  isCategorizedTimeseries?: boolean;
};

export const TimeseriesChartPage = function ({
  chart: Chart,
  title,
  description,
  isCategorizedTimeseries,
}: TimeseriesChartPageProps) {
  const {
    filterParams: {
      categories: categoriesQueryParam,
      rollups: rollupsQueryParam,
    },
    isReady,
  } = useQueryParams();
  const queryParamsExists = Boolean(
    categoriesQueryParam?.length || rollupsQueryParam?.length
  );
  const categories = queryParamsExists
    ? categoriesQueryParam
    : ["other" as const];
  const rollups = queryParamsExists ? rollupsQueryParam : ["all" as const];
  const allRollupsSelected = rollups && rollups[0] === "all";
  const itemCount = !allRollupsSelected
    ? (categories?.length ?? 0) + (rollups?.length ?? 0)
    : undefined;

  const { data: chartDatasets, isLoading } = useTimeseriesQuery({
    metrics: Chart.requiredMetrics,
    categories: isCategorizedTimeseries ? categories : undefined,
    rollups: isCategorizedTimeseries ? rollups : undefined,
  });

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <Header>{title}</Header>
      <div>{description}</div>
      {isCategorizedTimeseries && <FiltersBar hideRangeFilter hideSortFilter />}
      <Chart
        dataset={chartDatasets}
        isLoading={isLoading}
        size="2xl"
        skeletonOpts={{
          chart: {
            itemCount: allRollupsSelected ? 720 : 180,
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
