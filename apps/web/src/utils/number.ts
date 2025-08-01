type FormatMode = "compact" | "standard";

export type Numerish = number | string | bigint;

const SCALE_FACTOR = 1e10;

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

export function abbreviateNumber(value: number | string): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
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

export function formatFiat(
  value: number | string,
  opts: Intl.NumberFormatOptions = {}
): string {
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "standard",
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
    ...opts,
  }).format(Number(value));
}

export function formatEthFiatPrice(value: string | number) {
  return formatFiat(value, {
    maximumFractionDigits: 20,
  });
}

export function formatNumber(
  x: Numerish,
  mode: "compact" | "standard" = "standard",
  opts: Intl.NumberFormatOptions = {}
): string {
  return Intl.NumberFormat("en-US", { ...NUMBER_FORMAT[mode], ...opts }).format(
    Number(x)
  );
}

export function removeCommas(formattedNumber: string): string {
  return formattedNumber.trim().replace(/,/g, "");
}

export function parseSuffixedNumber(value: string): [number, string?] {
  // Remove any leading/trailing whitespace
  value = removeCommas(value);

  // Regular expression to match the numerical part and optional suffix
  const regex = /^(-?\d+(?:\.\d+)?)([a-zA-Z]+)?$/;
  const match = value.match(regex);

  if (!match || !match[1]) {
    return [parseFloat(value)];
  }

  const numberPart = parseFloat(match[1]);
  const suffixPart = match[2] ? match[2].toUpperCase() : undefined;

  return [numberPart, suffixPart];
}

export function parseDecimalNumber(value: string) {
  return removeCommas(value).split(".");
}

export function calculatePercentage(
  numerator: Numerish,
  denominator: Numerish,
  opts?: Partial<{
    asFraction?: boolean;
    returnComplement: boolean;
    decimals: number;
  }>
): number {
  const numerator_ = normalizeNumerish(numerator);
  const denominator_ = normalizeNumerish(denominator);

  if (denominator_ === 0 || denominator_ === BigInt(0)) {
    return 0;
  }

  const decimals = opts?.decimals ?? 2;

  let pct: number;

  if (typeof numerator_ === "number" || typeof denominator_ === "number") {
    // Perform normal division for numbers
    pct = Number(numerator_) / Number(denominator_);
  } else {
    // Convert both to BigInt and perform division
    const num = BigInt(numerator_);
    const den = BigInt(denominator_);
    pct = Number((num * BigInt(SCALE_FACTOR)) / den); // Convert back to number after computation
    pct /= SCALE_FACTOR;
  }

  pct = toFixedTruncate(pct * 100, decimals);

  if (opts?.asFraction) {
    pct /= 100;
  }

  if (opts?.returnComplement) {
    const total = opts?.asFraction ? 1 : 100;

    return total - pct;
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

export function findBiggestValue<T extends number[] | bigint[] | string[]>(
  values: T
): T[number] {
  return values.reduce((a, b) => {
    const a_ = typeof a === "string" ? BigInt(a) : a;
    const b_ = typeof b === "string" ? BigInt(b) : b;

    return a_ > b_ ? a_ : b_;
  }, 0);
}

export function normalizeNumerish(value: Numerish) {
  if (typeof value === "string") {
    if (value.includes(".")) {
      return Number(value);
    }

    return BigInt(value);
  }

  return value;
}

export function toFixedTruncate(num: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
}
