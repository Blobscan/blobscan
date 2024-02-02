import type { Options } from "pretty-bytes";
import prettyBytes from "pretty-bytes";

type FormatMode = "compact" | "standard";

export type BigIntLike = bigint | number | string;

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

export function performDiv(a: BigIntLike, b: BigIntLike, precision = 16) {
  const a_ = BigInt(a);
  const b_ = BigInt(b);

  if (b_ === BigInt(0)) {
    throw new Error("Division by zero");
  }

  const scaleFactor = 10 ** precision;
  const scaledResult = (a_ * BigInt(scaleFactor)) / b_;

  return Number(scaledResult) / scaleFactor;
}

export function formatNumber(
  x: number | string | bigint,
  mode: "compact" | "standard" = "standard",
  opts: Intl.NumberFormatOptions = {}
): string {
  return Intl.NumberFormat("en-US", { ...NUMBER_FORMAT[mode], ...opts }).format(
    Number(x)
  );
}

export function calculatePercentage(
  numerator: BigIntLike,
  denominator: BigIntLike,
  opts?: Partial<{ returnComplement: boolean }>
): number {
  const num = BigInt(numerator);
  const denom = BigInt(denominator);

  if (denom === BigInt(0)) {
    return Number(0);
  }

  const pct = performDiv(num, denom) * 100;

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
