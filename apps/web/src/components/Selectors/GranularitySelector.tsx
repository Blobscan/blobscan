import type { MetricsGranularity } from "@blobscan/zod";

import { Listbox } from "../Selects";
import type { ListboxProps, SelectOption } from "../Selects";

export type GranularitySelectorOption = SelectOption<MetricsGranularity>;

const GRANULARITY_OPTION_BY_VALUE = {
  hour: { value: "hour", label: "Hourly" },
  day: { value: "day", label: "Daily" },
  week: { value: "week", label: "Weekly" },
  month: { value: "month", label: "Monthly" },
  year: { value: "year", label: "Yearly" },
} satisfies Record<MetricsGranularity, GranularitySelectorOption>;

export function getGranularityOption(
  granularity: MetricsGranularity
): GranularitySelectorOption {
  return GRANULARITY_OPTION_BY_VALUE[granularity];
}

export type GranularitySelectorProps = Omit<
  ListboxProps<MetricsGranularity, false, false>,
  "options" | "multiple" | "nullable" | "placeholder"
> & {
  /**
   * The granularities that the time frame allows.
   */
  granularities: readonly MetricsGranularity[];
};

export function GranularitySelector({
  granularities,
  ...props
}: GranularitySelectorProps) {
  return (
    <Listbox {...props} options={granularities.map(getGranularityOption)} />
  );
}
