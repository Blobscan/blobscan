import type { TimeFrame } from "@blobscan/api";

import type { TimeseriesGranularity } from "~/types";
import { Listbox } from "../Selects";
import type { ListboxProps, SelectOption } from "../Selects";

/**
 * The time frames of the chart pages. See getChartTimeFrameGranularity for
 * the length of their periods.
 */
export const CHART_TIME_FRAMES = [
  "1d",
  "7d",
  "30d",
  "90d",
  "365d",
  "All",
] as const satisfies readonly TimeFrame[];

export type ChartTimeFrame = (typeof CHART_TIME_FRAMES)[number];

export const DEFAULT_CHART_TIME_FRAME: ChartTimeFrame = "All";

/**
 * Returns the length of the periods that the API gives for the time frame. A
 * chart split by category or rollup uses weeks for 1Y and All, because it
 * draws stacked bars. Keep it the same as getTimeFrameGranularity in
 * @blobscan/api.
 */
export function getChartTimeFrameGranularity(
  timeFrame: ChartTimeFrame,
  { isSegmented }: { isSegmented: boolean }
): TimeseriesGranularity {
  switch (timeFrame) {
    case "1d":
    case "7d":
      return "hour";
    case "365d":
    case "All":
      return isSegmented ? "week" : "day";
    default:
      return "day";
  }
}

export type TimeFrameSelectorOption = SelectOption<ChartTimeFrame>;

// "M" is a month. 1M is the last 30 days and 3M is the last 90 days.
export const TIME_FRAME_OPTIONS: TimeFrameSelectorOption[] = [
  { value: "1d", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "1M" },
  { value: "90d", label: "3M" },
  { value: "365d", label: "1Y" },
  { value: "All", label: "All" },
];

export function getTimeFrameOption(timeFrame: ChartTimeFrame) {
  return (
    TIME_FRAME_OPTIONS.find((o) => o.value === timeFrame) ??
    (TIME_FRAME_OPTIONS.at(-1) as TimeFrameSelectorOption)
  );
}

export type TimeFrameSelectorProps = Omit<
  ListboxProps<ChartTimeFrame, false, false>,
  "options" | "multiple" | "nullable" | "placeholder"
>;

export function TimeFrameSelector(props: TimeFrameSelectorProps) {
  return <Listbox {...props} options={TIME_FRAME_OPTIONS} />;
}
