import type { ReactNode } from "react";

import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import { useUrlState } from "~/hooks/useUrlState";
import { categoriesParamSchema, rollupsSchema } from "~/schemas/filters";
import type { TimeseriesChartComponent } from "./Charts/TimeseriesChartBase";
import { TimeseriesFilterBar } from "./FilterBars/TimeseriesFilterBar";
import { Header } from "./Header";

export type TimeseriesChartPageProps = {
  chart: TimeseriesChartComponent;
  description: ReactNode;
  enableFilters?: boolean;
  title: ReactNode;
  isCategorizedTimeseries?: boolean;
};

const queryParamsSchema = categoriesParamSchema.merge(rollupsSchema);

export const TimeseriesChartPage = function ({
  chart: Chart,
  title,
  description,
  isCategorizedTimeseries,
}: TimeseriesChartPageProps) {
  const { state, isReady } = useUrlState(queryParamsSchema);
  const queryParamsExists = Boolean(
    state?.categories?.length || state?.rollups?.length
  );
  const categories = queryParamsExists ? state?.categories : ["other" as const];
  const rollups = queryParamsExists ? state?.rollups : ["all" as const];
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
      {isCategorizedTimeseries && <TimeseriesFilterBar />}
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
