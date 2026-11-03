import dayjs from "@blobscan/dayjs";
import { convertWei } from "@blobscan/eth-format";

import { ROLLUP_DEFINITIONS } from "~/defintions/rollups";
import type { Rollup, TimeseriesGranularity } from "~/types";
import {
  convertBytes,
  formatFiat,
  formatNumber,
  HUMAN_DATE_FORMAT,
} from "~/utils";
import type { Numerish } from "~/utils";
import type { BytesAxis, EtherAxis, FiatAxis, Axis } from "../types";

export function formatAxisValue(
  value: Numerish | Date,
  axis: Axis,
  compact?: boolean
) {
  const { type, unitType } = axis;

  const isDateValue = value instanceof Date || typeof value === "string";

  if (type === "time" && isDateValue) {
    return formatTimeValue(value as Date | string, compact, axis.granularity);
  }

  const value_ = value as Numerish;
  switch (unitType) {
    case "ether":
      return formatEtherValue(value_, axis, compact);
    case "byte":
      return formatBytesValue(value_, axis, compact);
    case "fiat":
      return formatFiatValue(value_, axis, compact);
    default:
      return formatUnknownValue(value_, compact);
  }
}

// The periods start at UTC boundaries (a week starts on Monday 00:00 UTC), so
// the dates show in UTC. In a local timezone, a period can show the date of
// the day before.
const TIME_FORMATS: Record<
  TimeseriesGranularity,
  { compact: string; full: string }
> = {
  hour: { compact: "MMM DD HH:mm", full: `${HUMAN_DATE_FORMAT}, HH:mm [UTC]` },
  day: { compact: "MMM DD", full: HUMAN_DATE_FORMAT },
  week: { compact: "MMM DD", full: `[Week of] ${HUMAN_DATE_FORMAT}` },
};

export function formatTimeValue(
  value: string | Date,
  compact?: boolean,
  granularity: TimeseriesGranularity = "day"
) {
  const { compact: compactFormat, full } = TIME_FORMATS[granularity];

  return dayjs.utc(value).format(compact ? compactFormat : full);
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

export function formatFiatValue(
  value: Numerish,
  { unit }: FiatAxis,
  compact?: boolean
) {
  const number = Number(value);

  // A blob fee can be much less than one cent. Show its first significant
  // digits, not 0.00.
  if (number !== 0 && Math.abs(number) < 1) {
    return formatFiat(value.toString(), {
      currency: unit,
      maximumSignificantDigits: 3,
    });
  }

  return formatFiat(value.toString(), {
    currency: unit,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatUnknownValue(value: Numerish, compact?: boolean) {
  return formatNumber(value, compact ? "compact" : "standard", {
    maximumFractionDigits: 2,
  });
}

export function formatSeriesName(name?: string) {
  const rollupLabel = ROLLUP_DEFINITIONS[name as Rollup]?.name;

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
