import { chain } from "./chain";

const BLOB_PARAMS = chain.latestFork.blobParams;

export const COMMON_MAX_FEE_PER_BLOB_GAS = [
  1000000000, 2, 150000000000, 10, 2000000000, 26000000000, 1, 4000000000, 4,
  10000000000, 80000000000, 50000000000, 56000000000, 8, 65000000000, 20,
  8000000000, 60000000000, 20000000000, 16, 15000000000, 6, 119443524432,
  90741658012, 30, 77553845946, 102084366682, 98154088832, 30000000000,
  5000000000, 176876867046, 134373966794, 129200529966, 139754557944,
  71000000000, 25000000000, 13253037170, 145350598142, 106172020274,
  61277111208, 32, 40, 110423351454, 87248077832, 12000000000, 94375127918,
  31436483250, 151170714642, 41379939894, 74568000282, 58917924626, 29062453216,
  83889001508, 50, 12, 71697110620, 124226272074, 24838702154, 114844914084,
  14200000000, 40000000000, 56649567354, 52371487834, 54468542552, 44760150790,
].map((x) => BigInt(x));

export function fakeExponential(
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

export function getEIP2028CalldataGas(hexData: string) {
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

export function calculateBlobGasPrice(excessBlobGas: bigint): bigint {
  const { minBlobBaseFee, blobBaseFeeUpdateFraction } = BLOB_PARAMS;

  return BigInt(
    fakeExponential(minBlobBaseFee, excessBlobGas, blobBaseFeeUpdateFraction)
  );
}

export function calculateExcessBlobGas(
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint
) {
  const targetBlobGasPerBlock = BLOB_PARAMS.targetBlobGasPerBlock;
  const excessBlobGas = BigInt(parentExcessBlobGas.toString());
  const blobGasUsed = BigInt(parentBlobGasUsed.toString());

  if (excessBlobGas + blobGasUsed < targetBlobGasPerBlock) {
    return BigInt(0);
  } else {
    return excessBlobGas + blobGasUsed - targetBlobGasPerBlock;
  }
}
