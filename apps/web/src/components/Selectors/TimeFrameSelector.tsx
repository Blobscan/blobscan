import { chartTimeFrameSchema } from "~/schemas/filters";
import type { ChartTimeFrame } from "~/schemas/filters";
import { Listbox } from "../Selects";
import type { ListboxProps, SelectOption } from "../Selects";

export type { ChartTimeFrame } from "~/schemas/filters";

export const DEFAULT_CHART_TIME_FRAME: ChartTimeFrame = "All";

export type TimeFrameSelectorOption = SelectOption<ChartTimeFrame>;

// "M" is a month. 1M is the last 30 days and 3M is the last 90 days.
const TIME_FRAME_OPTION_BY_VALUE = {
  "1d": { value: "1d", label: "24H" },
  "7d": { value: "7d", label: "7D" },
  "30d": { value: "30d", label: "1M" },
  "90d": { value: "90d", label: "3M" },
  "365d": { value: "365d", label: "1Y" },
  All: { value: "All", label: "All" },
} satisfies Record<ChartTimeFrame, TimeFrameSelectorOption>;

export const TIME_FRAME_OPTIONS: TimeFrameSelectorOption[] =
  chartTimeFrameSchema.options.map(
    (timeFrame) => TIME_FRAME_OPTION_BY_VALUE[timeFrame]
  );

export function getTimeFrameOption(
  timeFrame: ChartTimeFrame
): TimeFrameSelectorOption {
  return TIME_FRAME_OPTION_BY_VALUE[timeFrame];
}

export type TimeFrameSelectorProps = Omit<
  ListboxProps<ChartTimeFrame, false, false>,
  "options" | "multiple" | "nullable" | "placeholder"
>;

export function TimeFrameSelector(props: TimeFrameSelectorProps) {
  return <Listbox {...props} options={TIME_FRAME_OPTIONS} />;
}
