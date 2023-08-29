import type { Options } from "pretty-bytes";
import prettyBytes from "pretty-bytes";

export function formatBytes(bytes: number | bigint, opts: Options = {}) {
  const bytes_ = typeof bytes === "bigint" ? Number(bytes) : bytes;

  return prettyBytes(bytes_, {
    maximumFractionDigits: 3,
    binary: true,
    ...opts,
  });
}

export function parseAmountWithUnit(amountWithUnit: string): {
  value: number;
  unit: string;
} {
  const [value = 0, unit = ""] = amountWithUnit.split(" ");

  return {
    value: Number(value),
    unit,
  };
}

export function abbreviateNumber(value: number | string): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export function formatNumber(
  x: number | string | bigint,
  opts?: Intl.NumberFormatOptions
): string {
  return Number(x).toLocaleString(undefined, opts);
}

export function calculatePercentage(
  numerator: bigint,
  denominator: bigint
): number {
  if (denominator === BigInt(0)) {
    return Number(0);
  }

  return (Number((numerator * BigInt(100)) / denominator) / 100) * 100;
}
