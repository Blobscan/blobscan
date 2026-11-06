import { prettyFormatWei } from "@blobscan/eth-format";

import type { FeeUnit } from "~/components/Toggles";
import { formatBytes, formatFiat, formatNumber } from "~/utils";

export function formatCount(value: number | bigint) {
  return formatNumber(value);
}

export function formatPercentage(value: number | undefined, digits = 2) {
  if (value === undefined) {
    return undefined;
  }

  // Show a very small share with more digits than zero.
  const percentage = value * 100;
  const fractionDigits = percentage > 0 && percentage < 0.01 ? 4 : digits;

  return `${formatNumber(percentage, "standard", {
    maximumFractionDigits: fractionDigits,
  })}%`;
}

export function formatWeiAmount(wei: bigint | undefined) {
  return wei === undefined ? undefined : prettyFormatWei(wei);
}

export function formatUsdAmount(value: number | undefined | null) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return formatFiat(value, {
    maximumFractionDigits: Math.abs(value) < 1 ? 4 : 2,
  });
}

/** Formats a fee in the selected unit. */
export function formatFee(
  unit: FeeUnit,
  wei: bigint | undefined,
  usd: number | undefined | null
) {
  return unit === "usd" ? formatUsdAmount(usd) : formatWeiAmount(wei);
}

export function formatByteAmount(bytes: bigint | number) {
  return formatBytes(Number(bytes));
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Formats a duration, for example "12 min", "3.5 hours" or "2.1 days". */
export function formatDuration(ms: number) {
  if (ms < HOUR) {
    return `${formatNumber(Math.max(ms / MINUTE, 0), "standard", {
      maximumFractionDigits: 0,
    })} min`;
  }

  if (ms < 2 * DAY) {
    return `${formatNumber(ms / HOUR, "standard", {
      maximumFractionDigits: 1,
    })} hours`;
  }

  return `${formatNumber(ms / DAY, "standard", {
    maximumFractionDigits: 1,
  })} days`;
}
