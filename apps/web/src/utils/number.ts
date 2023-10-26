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

export function abbreviateNumber(value: number | string): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

type FormatMode = "compact" | "standard";

const NUMBER_FORMAT: Record<FormatMode, Intl.NumberFormatOptions> = {
  compact: {
    notation: "compact",
    maximumFractionDigits: 2,
  },
  standard: {
    notation: "standard",
    compactDisplay: "long",
    maximumFractionDigits: 3,
  },
};
export function formatNumber(
  x: number | string | bigint,
  mode: "compact" | "standard" = "standard",
  opts: Intl.NumberFormatOptions = {}
): string {
  // return Number(x).toLocaleString(undefined, opts);

  return Intl.NumberFormat("en-US", { ...NUMBER_FORMAT[mode], ...opts }).format(
    Number(x)
  );
}

export function calculatePercentage(
  numerator: bigint,
  denominator: bigint,
  opts?: { returnComplement: boolean }
): number {
  if (denominator === BigInt(0)) {
    return Number(0);
  }

  const pct = (Number((numerator * BigInt(100)) / denominator) / 100) * 100;

  if (opts?.returnComplement) {
    return 100 - pct;
  }

  return pct;
}

function isNumberArray(arr: unknown[]): arr is number[] {
  return arr.every((x) => typeof x === "number");
}

export function cumulativeSum(arr: number[]): number[];
export function cumulativeSum(arr: bigint[]): bigint[];
export function cumulativeSum(arr: number[] | bigint[]): number[] | bigint[] {
  if (isNumberArray(arr)) {
    return arr.reduce<number[]>(
      (acc, curr, i) => [...acc, curr + (acc[i - 1] ?? 0)],
      []
    );
  } else {
    return arr.reduce<bigint[]>(
      (acc, curr, i) => [...acc, curr + (acc[i - 1] ?? BigInt(0))],
      []
    );
  }
}
