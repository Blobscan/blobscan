import { calculatePercentage, formatNumber, performDiv } from "./number";

export const GAS_PER_BLOB = 131_072; // 2 ** 17
export const BLOB_SIZE = GAS_PER_BLOB;
export const TARGET_BLOB_GAS_PER_BLOCK = 393_216;
export const TARGET_BLOBS_PER_BLOCK = TARGET_BLOB_GAS_PER_BLOCK / GAS_PER_BLOB;
export const BLOB_GAS_LIMIT_PER_BLOCK = 786_432;
export const MAX_BLOBS_PER_BLOCK = BLOB_GAS_LIMIT_PER_BLOCK / GAS_PER_BLOB;

export type EtherUnit = "wei" | "Gwei" | "ether";

export type FormatWeiOptions = {
  toUnit: EtherUnit;
  displayUnit: boolean;
  compact: boolean;
};

function formatWithDecimal(str: string, positionFromEnd: number): string {
  const [integerPart = "", decimalPart = ""] = str.split(".");

  if (integerPart.length <= positionFromEnd) {
    const zeroes = "0".repeat(positionFromEnd - integerPart.length);
    const result = "0." + zeroes + integerPart + decimalPart;
    return stripTrailingZeroes(result);
  }

  const newIntegerPart = integerPart.slice(0, -positionFromEnd);
  const newDecimalPart = integerPart.slice(-positionFromEnd);
  const result = `${newIntegerPart}.${newDecimalPart}${decimalPart}`;

  return stripTrailingZeroes(result);
}

function stripTrailingZeroes(str: string): string {
  if (str.includes(".")) {
    while (str[str.length - 1] === "0") {
      str = str.slice(0, -1);
    }
    if (str[str.length - 1] === ".") {
      str = str.slice(0, -1);
    }
  }
  return str;
}

export function convertWei(
  weiAmount: string | number,
  toUnit: EtherUnit = "Gwei"
) {
  const weiAmount_ =
    typeof weiAmount === "number" ? weiAmount.toString() : weiAmount;

  switch (toUnit) {
    case "wei":
      return weiAmount_;
    case "Gwei":
      return formatWithDecimal(weiAmount_, 9);
    case "ether":
      return formatWithDecimal(weiAmount_, 18);
  }
}

export function calculateBlobGasTarget(blobGasUsed: bigint) {
  const blobsInBlock = performDiv(blobGasUsed, BigInt(GAS_PER_BLOB));
  const targetPercentage =
    blobsInBlock < TARGET_BLOBS_PER_BLOCK
      ? calculatePercentage(blobsInBlock, TARGET_BLOBS_PER_BLOCK)
      : calculatePercentage(
          blobsInBlock - TARGET_BLOBS_PER_BLOCK,
          TARGET_BLOBS_PER_BLOCK
        );

  return targetPercentage;
}

export function formatWei(
  weiAmount: bigint | number,
  {
    toUnit = "Gwei",
    displayUnit = true,
    compact = false,
  }: Partial<FormatWeiOptions> = {}
): string {
  const weiAmountStr =
    // Wei amounts should be integers
    typeof weiAmount === "number"
      ? Math.floor(weiAmount).toString()
      : weiAmount.toString();
  let formattedAmount = convertWei(weiAmountStr, toUnit);
  const fractionDigits = formattedAmount.split(".")[1];

  // Use exponential notation for large fractional digits
  if (compact && fractionDigits && fractionDigits.length > 3) {
    formattedAmount = Number(formattedAmount).toExponential();
  }

  formattedAmount = formatNumber(
    formattedAmount,
    compact ? "compact" : "standard",
    {
      maximumFractionDigits: compact ? 5 : 18,
    }
  );

  return `${formattedAmount}${displayUnit ? ` ${toUnit}` : ""}`;
}

export function shortenAddress(address: string, length = 4): string {
  return `${address.slice(0, length)}…${address.slice(-length)}`;
}
