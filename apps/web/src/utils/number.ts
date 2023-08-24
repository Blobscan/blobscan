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

export function parseBytes(bytes: string): { value: number; unit: string } {
  const [value = 0, unit = "B"] = bytes.split(" ");

  return {
    value: Number(value),
    unit,
  };
}

export function abbreviateNumber(value: number | string): string {
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixNum = 0;
  let value_ = Number(value);

  while (value_ >= 1000) {
    value_ /= 1000;
    suffixNum++;
  }

  let formattedValue = formatNumber(value_.toPrecision(3));

  formattedValue += suffixes[suffixNum];

  return formattedValue;
}

export function formatNumber(
  x: number | string | bigint,
  opts?: Intl.NumberFormatOptions
): string {
  return Number(x).toLocaleString(undefined, opts);
}
