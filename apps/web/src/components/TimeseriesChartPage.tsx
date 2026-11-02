import type { ReactNode } from "react";

import { z } from "@blobscan/zod";

import { SeoMetaTags } from "~/components/SeoMetaTags";
import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import { useUrlState } from "~/hooks/useUrlState";
import { categoriesParamSchema, rollupsSchema } from "~/schemas/filters";
import type { TimeseriesChartComponent } from "./Charts/TimeseriesChartBase";
import { TimeseriesControlBar } from "./ControlBars/TimeseriesControlBar";
import { Header } from "./Header";
import { getFeeUnitLabels } from "./TimeseriesCharts/FeeUnitChart";
import { FEE_UNITS, FeeUnitToggle } from "./Toggles";

export type TimeseriesChartPageProps = {
  chart: TimeseriesChartComponent;
  /**
   * The same chart in USD. With it, the chart header shows an ETH/USD toggle.
   */
  usdChart?: TimeseriesChartComponent;
  description: ReactNode;
  enableControls?: boolean;
  title: ReactNode;
  isCategorizedTimeseries?: boolean;
};

const controlQueryParamsSchema = categoriesParamSchema
  .merge(rollupsSchema)
  .merge(z.object({ unit: z.enum(FEE_UNITS).optional() }));

export const TimeseriesChartPage = function ({
  chart: ethChart,
  usdChart,
  title,
  description,
  isCategorizedTimeseries,
}: TimeseriesChartPageProps) {
  const { state, isReady, updateState } = useUrlState(controlQueryParamsSchema);
  const queryParamsExists = Boolean(
    state?.categories?.length || state?.rollups?.length
  );
  const categories = queryParamsExists ? state?.categories : ["other" as const];
  const rollups = queryParamsExists ? state?.rollups : ["all" as const];
  const allRollupsSelected = rollups && rollups[0] === "all";
  const itemCount = !allRollupsSelected
    ? (categories?.length ?? 0) + (rollups?.length ?? 0)
    : undefined;
  const unit = usdChart ? state?.unit ?? "eth" : "eth";
  const Chart = unit === "usd" && usdChart ? usdChart : ethChart;

  const { data: chartDatasets, isLoading } = useTimeseriesQuery({
    metrics: Chart.requiredMetrics,
    categories: isCategorizedTimeseries ? categories : undefined,
    rollups: isCategorizedTimeseries ? rollups : undefined,
  });

  if (!isReady) {
    return null;
  }

  return (
    <>
      <SeoMetaTags
        title={typeof title === "string" ? title : undefined}
        description={typeof description === "string" ? description : undefined}
      />
      <div className="flex flex-col gap-8">
        <Header>{title}</Header>
        <div>{description}</div>
        {isCategorizedTimeseries && <TimeseriesControlBar />}
        <Chart
          dataset={chartDatasets}
          isLoading={isLoading}
          size="2xl"
          headerControls={
            usdChart ? (
              <FeeUnitToggle
                unit={unit}
                labels={getFeeUnitLabels(ethChart, usdChart)}
                onChange={(u) =>
                  updateState({ unit: u !== "eth" ? u : undefined })
                }
              />
            ) : undefined
          }
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
    </>
  );
};
