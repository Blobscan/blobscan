import type { Options } from "pretty-bytes";
import prettyBytes from "pretty-bytes";

export function formatBytes(bytes: number, opts: Options = {}) {
  return prettyBytes(bytes, {
    maximumFractionDigits: 3,
    binary: true,
    ...opts,
  });
}

export function abbreviateNumber(value: number | string): string {
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixNum = 0;
  let value_ = Number(value);

  while (value_ >= 1000) {
    value_ /= 1000;
    suffixNum++;
  }

  let formattedValue = value_.toPrecision(3);

  formattedValue += suffixes[suffixNum];

  return formattedValue;
}
