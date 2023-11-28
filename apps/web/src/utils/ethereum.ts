import { formatNumber } from "./number";

const MIN_BLOB_GASPRICE = BigInt(1);
const BLOB_GASPRICE_UPDATE_FRACTION = BigInt(3_338_477);
export const GAS_PER_BLOB = BigInt(2 ** 17); // 131_072

export type EtherUnit = "wei" | "gwei" | "ether";

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

export type FormatWeiOptions = {
  toUnit: EtherUnit;
  displayUnit: boolean;
  compact: boolean;
};

export function convertWei(
  weiAmount: string | number,
  toUnit: EtherUnit = "gwei"
) {
  const weiAmount_ =
    typeof weiAmount === "number" ? weiAmount.toString() : weiAmount;

  switch (toUnit) {
    case "wei":
      return weiAmount_;
    case "gwei":
      return formatWithDecimal(weiAmount_, 9);
    case "ether":
      return formatWithDecimal(weiAmount_, 18);
  }
}

export function gasTarget(blobGasUsed: bigint): string {
  const blobsInBlock = blobGasUsed / GAS_PER_BLOB;
  const targetBlobsPerBlock = BigInt(3);
  const targetPercent =
    blobsInBlock < targetBlobsPerBlock
      ? `${(blobsInBlock * BigInt(100)) / targetBlobsPerBlock}`
      : `${
          ((blobsInBlock - targetBlobsPerBlock) * BigInt(100)) /
          targetBlobsPerBlock
        }`;
  const sign = blobsInBlock < targetBlobsPerBlock ? "-" : "+";
  const percentStr = `${sign}${targetPercent}`;
  return `${percentStr}% Blob Gas Target`;
}

export function formatWei(
  weiAmount: bigint | number,
  {
    toUnit = "gwei",
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
      // Display up to 9 decimal digits for small wei amounts
      maximumFractionDigits: weiAmountStr.length < 12 ? 18 : 3,
    }
  );

  return `${formattedAmount}${displayUnit ? ` ${toUnit}` : ""}`;
}

function fakeExponential(
  factor: bigint,
  numerator: bigint,
  denominator: bigint
): bigint {
  let i = BigInt(1);
  let output = BigInt(0);
  let numerator_accumulator = factor * denominator;

  while (numerator_accumulator > 0) {
    output += numerator_accumulator;
    numerator_accumulator =
      (numerator_accumulator * numerator) / (denominator * i);

    i++;
  }

  return output / denominator;
}

export function getEIP2028CalldataGas(hexData: string): bigint {
  const bytes = Buffer.from(hexData.slice(2), "hex");
  let gasCost = BigInt(0);

  for (const byte of bytes.entries()) {
    if (byte[1] === 0) {
      gasCost += BigInt(4);
    } else {
      gasCost += BigInt(16);
    }
  }

  return gasCost;
}

export function calculateBlobSize(blob: string): number {
  return blob.slice(2).length / 2;
}

export function calculateBlobGasPrice(excessDataGas: bigint) {
  return fakeExponential(
    MIN_BLOB_GASPRICE,
    excessDataGas,
    BLOB_GASPRICE_UPDATE_FRACTION
  );
}
