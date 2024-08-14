const ETH_UNITS = { wei: 0, Gwei: 9, ether: 18 };

export type EtherUnit = keyof typeof ETH_UNITS;

/**
 * This function converts `wei` to the unit specified by `toUnit`,
 * adds commas to the integer part of the converted value,
 * and appends the unit.
 *
 * This function never converts the provided value to a Number
 * ensuring that the full precision of the input is preserved.
 */
export function formatWei(wei: bigint, toUnit: EtherUnit = "Gwei"): string {
  const converted = convertWei(wei, toUnit);
  const formatted = insertCommas(converted);
  return `${formatted} ${toUnit}`;
}

/**
 * This function converts `wei` to the unit specified by `toUnit`.
 */
export function convertWei(wei: bigint, toUnit: EtherUnit = "Gwei"): string {
  return shiftDecimal(wei, ETH_UNITS[toUnit]);
}

/**
 * This function finds the best unit to display the value of `wei`.
 */
export function findBestUnit(wei: bigint): EtherUnit {
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
 * This function moves the decimal point to the left by `decimals` places.
 */
export function shiftDecimal(value: bigint, decimals: number): string {
  const negative = value < 0;

  if (negative) {
    value = -value;
  }

  const str = value.toString().padStart(decimals, "0");

  const sign = negative ? "-" : "";
  const integer = str.slice(0, str.length - decimals) || "0";
  const decimal = str.slice(str.length - decimals);

  return removeExtraZeros(`${sign}${integer}.${decimal}`);
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
