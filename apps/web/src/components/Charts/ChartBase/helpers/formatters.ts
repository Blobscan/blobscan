import dayjs from "@blobscan/dayjs";
import { convertWei } from "@blobscan/eth-format";

import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { convertBytes, formatNumber, getHumanDate } from "~/utils";
import type { Numerish } from "~/utils";
import type { ByteMetricInfo, EtherMetricInfo, MetricInfo } from "../types";

export function formatMetricValue(
  value: Numerish | Date,
  metricInfo: MetricInfo,
  compact?: boolean
) {
  const { type, unitType } = metricInfo;

  const isDateValue = value instanceof Date || typeof value === "string";

  if (type === "time" && isDateValue) {
    return formatTimeMetric(value as Date | string, compact);
  }

  const value_ = value as Numerish;
  switch (unitType) {
    case "ether":
      return formatEtherMetric(value_, metricInfo, compact);
    case "byte":
      return formatBytesMetric(value_, metricInfo, compact);
    default:
      return formatUnknownMetric(value_, compact);
  }
}

export function formatTimeMetric(value: string | Date, compact?: boolean) {
  return compact ? dayjs(value).format("MMM DD") : getHumanDate(value);
}

export function formatEtherMetric(
  value: Numerish,
  { displayUnit, unit }: EtherMetricInfo,
  compact?: boolean
) {
  let convertedValue = value;

  if (unit === "wei" && displayUnit) {
    convertedValue = convertWei(value, displayUnit);
  }

  return formatNumber(convertedValue, compact ? "compact" : "standard", {
    maximumFractionDigits: 18,
  });
}

export function formatBytesMetric(
  value: Numerish,
  { displayUnit, unit }: ByteMetricInfo,
  compact?: boolean
) {
  let convertedValue = value;

  if (unit === "B" && displayUnit) {
    convertedValue = convertBytes(value, displayUnit);
  }

  return formatNumber(convertedValue, compact ? "compact" : "standard", {
    maximumFractionDigits: 2,
  });
}

export function formatUnknownMetric(value: Numerish, compact?: boolean) {
  return formatNumber(value, compact ? "compact" : "standard", {
    maximumFractionDigits: 2,
  });
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
