import dayjs from "@blobscan/dayjs";
import { convertWei } from "@blobscan/eth-format";

import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { convertBytes, formatNumber, getHumanDate } from "~/utils";
import type { Numerish } from "~/utils";
import type { MetricInfo } from "../types";

export function formatMetricValue(
  value: Numerish | Date,
  metricInfo: MetricInfo,
  compact?: boolean
) {
  const { type, unitType } = metricInfo;
  const isTimeMetric =
    value instanceof Date || (type === "time" && typeof value === "string");

  if (isTimeMetric) {
    return compact ? dayjs(value).format("MMM DD") : getHumanDate(value);
  }

  const opts: Intl.NumberFormatOptions = {};
  let displayValue = value;

  switch (unitType) {
    case "ether": {
      const { displayUnit, unit } = metricInfo;

      console.log(unit, displayUnit);
      if (unit === "wei" && displayUnit) {
        displayValue = convertWei(value, displayUnit);
      }

      if (unit === "wei") {
        opts.maximumFractionDigits = 18;
      }

      break;
    }
    case "byte": {
      const { unit, displayUnit } = metricInfo;

      if (["B", "byte"].includes(unit) && displayUnit) {
        displayValue = convertBytes(value, displayUnit);
      }

      opts.maximumFractionDigits = 2;
      break;
    }
    default:
      opts.maximumFractionDigits = 2;
      break;
  }

  console.log(displayValue);
  return formatNumber(displayValue, compact ? "compact" : "standard", opts);
}

export function formatSeriesName(name?: string) {
  const rollupLabel = ROLLUP_STYLES[name as Rollup]?.label;

  if (rollupLabel) {
    return rollupLabel;
  }

  if (name === "other") {
    return "Other";
  }

  if (name === "global") {
    return "Total";
  }

  return name ?? "Unknown";
}
