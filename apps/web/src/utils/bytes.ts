import { normalizeNumerish } from "./number";
import type { Numerish } from "./number";

export const BYTE_UNITS = [
  "B",
  "KiB",
  "MiB",
  "GiB",
  "TiB",
  "PiB",
  "EiB",
  "ZiB",
  "YiB",
] as const;

export type BytesOptions = {
  displayAllDecimals?: boolean;
  decimals?: number;
  hideUnit?: boolean;
  unit?: (typeof BYTE_UNITS)[number];
};

export function formatBytes(value: Numerish, opts?: BytesOptions): string {
  const value_ = normalizeNumerish(value);
  const { decimals = 2, displayAllDecimals, hideUnit, unit } = opts ?? {};

  const bytes_ = typeof value_ !== "number" ? Number(value_) : value_;

  if (bytes_ === 0) return hideUnit ? "0" : "0 B";

  const k = 1024; // Base for binary prefixes
  const decimals_ = decimals < 0 ? 0 : decimals;

  // Determine the index of the appropriate unit
  const i = unit
    ? BYTE_UNITS.indexOf(unit)
    : Math.floor(Math.log(bytes_) / Math.log(k));

  const convertedValue = bytes_ / Math.pow(k, i);
  const formattedValue = parseFloat(
    displayAllDecimals
      ? convertedValue.toString()
      : convertedValue.toFixed(decimals_)
  ).toString();

  return hideUnit ? formattedValue : `${formattedValue} ${BYTE_UNITS[i]}`;
}
