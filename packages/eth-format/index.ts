const ETH_UNITS = { wei: 0, Gwei: 9, ether: 18 };

export type EtherUnit = keyof typeof ETH_UNITS;

const compactFormatter = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

/**
 * This function converts `wei` to the unit specified by `toUnit`,
 * adds commas to the integer part of the converted value,
 * and appends the unit.
 *
 * This function never converts the provided value to a Number
 * ensuring that the full precision of the input is preserved.
 */
export function formatWei(
  wei: string | number | bigint,
  toUnit: EtherUnit = "Gwei"
): string {
  const converted = convertWei(wei, toUnit);
  const formatted = insertCommas(converted);
  return `${formatted} ${toUnit}`;
}

/**
 * The difference between this function and `formatWei` is that
 * this function does not ensure that the full precision of the input
 * is preserved. Instead, this function provides a more human-readable
 * representation of the value.
 */
export function prettyFormatWei(wei: bigint, toUnit: EtherUnit = "Gwei") {
  const converted = convertWei(wei, toUnit) as Intl.StringNumericLiteral;
  const formatted = compactFormatter.format(converted);
  return `${formatted} ${toUnit}`;
}

/**
 * This function converts `wei` to the unit specified by `toUnit`.
 */
export function convertWei(
  wei: string | number | bigint,
  toUnit: EtherUnit = "Gwei"
): string {
  return shiftDecimal(wei, ETH_UNITS[toUnit]);
}

/**
 * This function finds the best unit to display the value of `wei`.
 */
export function findBestUnit(wei: bigint | string | number): EtherUnit {
  if (typeof wei === "number") {
    wei = Math.round(wei);
  }

  const length = wei.toString().length;

  if (length >= ETH_UNITS.ether) {
    return "ether";
  }

  if (length >= ETH_UNITS.Gwei) {
    return "Gwei";
  }

  return "wei";
}

/**
 * This function converts an array of `wei` values to the best unit
 * and returns the converted values and the best unit.
 */
export function arrayBestUnit(arr?: number[]): {
  unit: EtherUnit;
  converted: string[];
} {
  if (!arr) {
    return {
      unit: "wei",
      converted: [],
    };
  }

  const maxVal = Math.max(...arr);
  const unit = findBestUnit(maxVal);

  return {
    converted: arr.map((value) => convertWei(value, unit)),
    unit,
  };
}

/**
 * This function moves the decimal point to the left by `decimals` places.
 */
export function shiftDecimal(
  value: string | number | bigint,
  decimals: number
): string {
  value = value.toString();

  const negative = value.startsWith("-");

  if (negative) {
    value = value.slice(1);
  }

  let [integer = "", decimal = ""] = value.split(".");

  const padded = integer.padStart(decimals, "0");
  integer = padded.slice(0, padded.length - decimals) || "0";
  decimal = padded.slice(padded.length - decimals) + decimal;

  return removeExtraZeros(`${negative ? "-" : ""}${integer}.${decimal}`);
}

/**
 * Remove zeros from the end of a string and the decimal point
 * if the rest of the decimal part is zero.
 */
function removeExtraZeros(str: string): string {
  while (str[str.length - 1] === "0") {
    str = str.slice(0, -1);
  }

  if (str[str.length - 1] === ".") {
    str = str.slice(0, -1);
  }

  return str;
}

/**
 * Add commas to the integer part of the string representation of a number.
 */
function insertCommas(value: string): string {
  const parts = value.split(".");

  let integer = parts[0] || "0";
  const decimal = parts[1];

  // Add commas to the integer part of the number.
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (decimal) {
    return `${integer}.${decimal}`;
  }

  return integer;
}
