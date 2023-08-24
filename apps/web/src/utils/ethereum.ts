import { formatNumber } from "./number";

const MIN_BLOB_GASPRICE = BigInt(1);
const BLOB_GASPRICE_UPDATE_FRACTION = BigInt(3_338_477);
export const GAS_PER_BLOB = BigInt(2 ** 17); // 131072

type EtherUnit = "wei" | "gwei" | "ether";

function formatWithDecimal(str: string, positionFromEnd: number): string {
  if (str.length <= positionFromEnd) {
    const zeroes = "0".repeat(positionFromEnd - str.length + 1);
    const result = "0." + zeroes + str;
    return stripTrailingZeroes(result);
  }

  const integerPart = str.slice(0, -positionFromEnd);
  const decimalPart = str.slice(-positionFromEnd);
  const result = `${integerPart}.${decimalPart}`;

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

export function formatWei(
  weiAmount: bigint | number,
  unit: EtherUnit = "gwei",
  displayUnit = true
): string {
  const weiStr = weiAmount.toString();
  let formattedAmount: string;

  switch (unit) {
    case "wei":
      formattedAmount = weiStr;
      break;
    case "gwei":
      formattedAmount = formatWithDecimal(weiStr, 9);
      break;
    case "ether":
      formattedAmount = formatWithDecimal(weiStr, 18);
      break;
    default:
      throw new Error("Unsupported unit");
  }

  return `${formatNumber(formattedAmount, { maximumFractionDigits: 18 })}${
    displayUnit ? ` ${unit}` : ""
  }`;
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

  return output;
}

export function getEIP2028CalldataGas(hexData: string): bigint {
  const bytes = Buffer.from(hexData.slice(2), "hex");
  let gasCost = 0;

  for (const byte of bytes.entries()) {
    if (byte[1] === 0) {
      gasCost += 4;
    } else {
      gasCost += 16;
    }
  }

  return BigInt(gasCost);
}

export function calculateBlobSize(blob: string): number {
  return blob.slice(2).length / 2;
}

export function calculateBlobGasPrice(excessDataGas: bigint): bigint {
  return BigInt(
    fakeExponential(
      BigInt(MIN_BLOB_GASPRICE),
      excessDataGas,
      BigInt(BLOB_GASPRICE_UPDATE_FRACTION)
    )
  );
}
