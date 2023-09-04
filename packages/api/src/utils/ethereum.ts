const MIN_BLOB_GASPRICE = 1;
const BLOB_GASPRICE_UPDATE_FRACTION = 3_338_477;

export const GAS_PER_BLOB = 2 ** 17; // 131072

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

export function getEIP2028CalldataGas(hexData: string): number {
  const bytes = Buffer.from(hexData.slice(2), "hex");
  let gasCost = 0;

  for (const byte of bytes.entries()) {
    if (byte[1] === 0) {
      gasCost += 4;
    } else {
      gasCost += 16;
    }
  }

  return gasCost;
}

export function calculateBlobSize(blob: string): number {
  return blob.slice(2).length / 2;
}

export function calculateBlobGasPrice(excessDataGas: number): bigint {
  return BigInt(
    fakeExponential(
      BigInt(MIN_BLOB_GASPRICE),
      BigInt(excessDataGas),
      BigInt(BLOB_GASPRICE_UPDATE_FRACTION)
    )
  );
}
