import { normalizeNumerish, toFixedTruncate } from "./number";
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

const BYNARY_PREFIX = 1024;

export type ByteUnit = (typeof BYTE_UNITS)[number];

export type BytesOptions = {
  displayAllDecimals?: boolean;
  decimals?: number;
  hideUnit?: boolean;
  unit?: ByteUnit;
};

export function findBestBytesUnit(value: Numerish): ByteUnit {
  const value_ = normalizeNumerish(value);
  const bytes_ = typeof value_ !== "number" ? Number(value_) : value_;

  if (bytes_ === 0) return "B";

  // Determine the index of the appropriate unit
  const i = Math.floor(Math.log(bytes_) / Math.log(BYNARY_PREFIX));

  return BYTE_UNITS[i] ?? "B";
}

export function convertBytes(value: Numerish, unit: ByteUnit) {
  const value_ = normalizeNumerish(value);

  const bytes_ = typeof value_ !== "number" ? Number(value_) : value_;

  if (bytes_ === 0) return bytes_;

  // Determine the index of the appropriate unit
  const i = BYTE_UNITS.indexOf(unit);

  const convertedValue = bytes_ / Math.pow(BYNARY_PREFIX, i);

  return convertedValue;
}

export function formatBytes(value: Numerish, opts?: BytesOptions): string {
  const { decimals = 2, displayAllDecimals, hideUnit, unit } = opts ?? {};

  const targetUnit = unit ?? findBestBytesUnit(value);
  const convertedBytes = convertBytes(value, targetUnit);

  if (convertedBytes === 0) return hideUnit ? "0" : "0 B";

  const decimals_ = decimals < 0 ? 0 : decimals;

  const formattedValue = parseFloat(
    displayAllDecimals
      ? convertedBytes.toString()
      : toFixedTruncate(convertedBytes, decimals_).toString()
  ).toString();

  return hideUnit ? formattedValue : `${formattedValue} ${targetUnit}`;
}
