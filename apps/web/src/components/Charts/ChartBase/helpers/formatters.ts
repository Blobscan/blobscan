import dayjs from "@blobscan/dayjs";
import { ROLLUP_REGISTRY } from "@blobscan/rollups";

import type { Rollup } from "~/types";
import { formatNumber, getHumanDate } from "~/utils";
import type { Numerish } from "~/utils";
import type { MetricInfo } from "../types";

export function formatMetricValue(
  value: Numerish,
  { type, unitType }: MetricInfo,
  compact?: boolean
) {
  if (type === "time") {
    if (typeof value !== "string") {
      return value;
    }

    return compact ? dayjs(value).format("MMM DD") : getHumanDate(value);
  }

  const opts: Intl.NumberFormatOptions = {};

  switch (unitType) {
    case "ether":
      opts.maximumFractionDigits = 18;
      break;
    case "byte": {
      opts.maximumFractionDigits = 5;
      break;
    }
    default:
      opts.maximumFractionDigits = 2;
      break;
  }

  return formatNumber(value, compact ? "compact" : "standard", opts);
}

export function formatSeriesName(name?: string) {
  const rollupLabel = ROLLUP_REGISTRY[name as Rollup]?.label;

  if (rollupLabel) {
    return rollupLabel;
  }

  if (name === "other") {
    return "Other";
  }

  return name ?? "Unknown";
}
