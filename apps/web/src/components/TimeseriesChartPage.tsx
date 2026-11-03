import type { ReactNode } from "react";

import { z } from "@blobscan/zod";

import { SeoMetaTags } from "~/components/SeoMetaTags";
import { useIsTestnet } from "~/hooks/useIsTestnet";
import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import { useUrlState } from "~/hooks/useUrlState";
import { categoriesParamSchema, rollupsSchema } from "~/schemas/filters";
import type { TimeseriesGranularity } from "~/types";
import type { SkeletonChartOptions } from "./Charts/ChartBase/helpers/skeleton";
import { TimeseriesControlBar } from "./ControlBars/TimeseriesControlBar";
import { Header } from "./Header";
import {
  getChartTimeFrameGranularity,
  CHART_TIME_FRAMES,
  DEFAULT_CHART_TIME_FRAME,
} from "./Selectors";
import type { ChartTimeFrame } from "./Selectors";
import { getFeeUnitLabels } from "./TimeseriesCharts/FeeUnitChart";
import type { TimeseriesChartComponent } from "./TimeseriesCharts/factories";
import { FEE_UNITS, FeeUnitToggle } from "./Toggles";

export type TimeseriesChartPageProps = {
  chart: TimeseriesChartComponent;
  /**
   * The same chart in USD. With it, the chart header shows an ETH/USD toggle.
   * Networks with no ETH price (e.g. testnets) do not use it.
   */
  usdChart?: TimeseriesChartComponent;
  /**
   * Returns the description of the chart for the length of its periods, for
   * example "This chart shows the total blobs per day".
   */
  description: (period: TimeseriesGranularity) => string;
  enableControls?: boolean;
  title: ReactNode;
  isCategorizedTimeseries?: boolean;
};

// The available skeleton sizes nearest to the number of periods. A segmented
// chart has weekly periods for 1Y and All.
const TIME_FRAME_SKELETON_ITEM_COUNTS: Record<
  ChartTimeFrame,
  SkeletonChartOptions["itemCount"]
> = {
  "1d": 30,
  "7d": 180,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  All: 720,
};
const SEGMENTED_TIME_FRAME_SKELETON_ITEM_COUNTS: Record<
  ChartTimeFrame,
  SkeletonChartOptions["itemCount"]
> = {
  ...TIME_FRAME_SKELETON_ITEM_COUNTS,
  "365d": 30,
  All: 180,
};

const controlQueryParamsSchema = categoriesParamSchema
  .merge(rollupsSchema)
  .merge(
    z.object({
      unit: z.enum(FEE_UNITS).optional(),
      timeFrame: z.enum(CHART_TIME_FRAMES).optional(),
    })
  );

export const TimeseriesChartPage = function ({
  chart: ethChart,
  usdChart: usdChartProp,
  title,
  description,
  isCategorizedTimeseries,
}: TimeseriesChartPageProps) {
  const { state, isReady, updateState } = useUrlState(controlQueryParamsSchema);
  const isTestnet = useIsTestnet();
  const usdChart = isTestnet === false ? usdChartProp : undefined;
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
  const timeFrame = state?.timeFrame ?? DEFAULT_CHART_TIME_FRAME;

  const { data: chartDatasets, isLoading } = useTimeseriesQuery({
    metrics: Chart.requiredMetrics,
    timeFrame,
    categories: isCategorizedTimeseries ? categories : undefined,
    rollups: isCategorizedTimeseries ? rollups : undefined,
  });

  if (!isReady || (usdChartProp && isTestnet === undefined)) {
    return null;
  }

  const descriptionText = description(
    getChartTimeFrameGranularity(timeFrame, {
      isSegmented: Boolean(isCategorizedTimeseries),
    })
  );

  return (
    <>
      <SeoMetaTags
        title={typeof title === "string" ? title : undefined}
        description={descriptionText}
      />
      <div className="flex flex-col gap-8">
        <Header>{title}</Header>
        <div>{descriptionText}</div>
        <TimeseriesControlBar showDimensionFilters={isCategorizedTimeseries} />
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
              itemCount: (isCategorizedTimeseries
                ? SEGMENTED_TIME_FRAME_SKELETON_ITEM_COUNTS
                : TIME_FRAME_SKELETON_ITEM_COUNTS)[timeFrame],
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
