import type { Options } from "pretty-bytes";
import prettyBytes from "pretty-bytes";

type FormatMode = "compact" | "standard";

export function numberToBigInt(value: number): bigint {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return BigInt(0);
  }

  return BigInt(Math.round(value));
}

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

export function performDiv(a: bigint, b: bigint, precision = 16) {
  if (b === BigInt(0)) {
    throw new Error("Division by zero");
  }

  const scaleFactor = 10 ** precision;
  const scaledResult = (a * BigInt(scaleFactor)) / b;

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
  numerator: bigint,
  denominator: bigint,
  opts?: Partial<{ returnComplement: boolean }>
): number {
  if (denominator === BigInt(0)) {
    return 0;
  }

  const pct = performDiv(numerator, denominator) * 100;

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

export function hexToBigInt(hex: string): string {
  return BigInt(hex).toString(10);
}
