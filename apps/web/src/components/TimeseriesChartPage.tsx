import type { ReactNode } from "react";

import {
  getTimeFrameDays,
  getTimeFrameGranularity,
} from "@blobscan/api/src/time-frames";
import { z } from "@blobscan/zod";

import { SeoMetaTags } from "~/components/SeoMetaTags";
import { useIsTestnet } from "~/hooks/useIsTestnet";
import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import { useUrlState } from "~/hooks/useUrlState";
import {
  categoriesParamSchema,
  rollupsSchema,
  timeFrameParamSchema,
} from "~/schemas/filters";
import type { TimeseriesGranularity } from "~/types";
import type { SkeletonChartOptions } from "./Charts/ChartBase/helpers/skeleton";
import { TimeseriesControlBar } from "./ControlBars/TimeseriesControlBar";
import { Header } from "./Header";
import { DEFAULT_CHART_TIME_FRAME } from "./Selectors";
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
  description: (granularity: TimeseriesGranularity) => string;
  enableControls?: boolean;
  title: ReactNode;
  isCategorizedTimeseries?: boolean;
};

const SKELETON_ITEM_COUNTS = [
  7, 15, 30, 90, 180, 365, 720,
] as const satisfies readonly SkeletonChartOptions["itemCount"][];

// "All" has no fixed number of days. The mainnet blobs start in March 2024.
const ALL_TIME_FRAME_DAYS = 960;

const PERIODS_PER_DAY = {
  hour: 24,
  day: 1,
  week: 1 / 7,
} satisfies Record<TimeseriesGranularity, number>;

/**
 * Returns the skeleton size nearest to the number of periods of the time
 * frame.
 */
function getSkeletonItemCount(
  timeFrame: ChartTimeFrame,
  granularity: TimeseriesGranularity
) {
  const days =
    timeFrame === "All" ? ALL_TIME_FRAME_DAYS : getTimeFrameDays(timeFrame);
  const periods = days * PERIODS_PER_DAY[granularity];

  return SKELETON_ITEM_COUNTS.reduce((nearest, count) =>
    Math.abs(count - periods) < Math.abs(nearest - periods) ? count : nearest
  );
}

const controlQueryParamsSchema = categoriesParamSchema
  .merge(rollupsSchema)
  .merge(timeFrameParamSchema)
  .merge(
    z.object({
      unit: z.enum(FEE_UNITS).optional(),
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

  const granularity = getTimeFrameGranularity(timeFrame, {
    isCategorized: Boolean(isCategorizedTimeseries),
  });
  const descriptionText = description(granularity);

  return (
    <>
      <SeoMetaTags
        title={typeof title === "string" ? title : undefined}
        description={descriptionText}
      />
      <div className="flex flex-col gap-8">
        <Header>{title}</Header>
        <div>{descriptionText}</div>
        <TimeseriesControlBar
          isCategorizedTimeseries={isCategorizedTimeseries}
        />
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
              itemCount: getSkeletonItemCount(timeFrame, granularity),
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
