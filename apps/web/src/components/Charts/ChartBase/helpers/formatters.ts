import dayjs from "@blobscan/dayjs";
import { convertWei } from "@blobscan/eth-format";

import { ROLLUP_STYLES } from "~/rollups";
import type { Rollup } from "~/types";
import { convertBytes, formatNumber, getHumanDate } from "~/utils";
import type { Numerish } from "~/utils";
import type { BytesAxis, EtherAxis, Axis } from "../types";

export function formatAxisValue(
  value: Numerish | Date,
  axis: Axis,
  compact?: boolean
) {
  const { type, unitType } = axis;

  const isDateValue = value instanceof Date || typeof value === "string";

  if (type === "time" && isDateValue) {
    return formatTimeValue(value as Date | string, compact);
  }

  const value_ = value as Numerish;
  switch (unitType) {
    case "ether":
      return formatEtherValue(value_, axis, compact);
    case "byte":
      return formatBytesValue(value_, axis, compact);
    default:
      return formatUnknownValue(value_, compact);
  }
}

export function formatTimeValue(value: string | Date, compact?: boolean) {
  return compact ? dayjs(value).format("MMM DD") : getHumanDate(value);
}

export function formatEtherValue(
  value: Numerish,
  { displayUnit, unit }: EtherAxis,
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

export function formatBytesValue(
  value: Numerish,
  { displayUnit, unit }: BytesAxis,
  compact?: boolean
) {
  let convertedValue = value;

  if (unit === "B" && displayUnit) {
    convertedValue = convertBytes(value, displayUnit);
  }

  return formatNumber(convertedValue, compact ? "compact" : "standard", {
    maximumFractionDigits: compact ? 2 : 6,
  });
}

export function formatUnknownValue(value: Numerish, compact?: boolean) {
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
