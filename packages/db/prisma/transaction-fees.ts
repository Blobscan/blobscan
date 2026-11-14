type Amount =
  | { toString(): string; toFixed?: (digits: number) => string }
  | null
  | undefined;

function toInteger(value: NonNullable<Amount>) {
  return BigInt(value.toFixed?.(0) ?? value.toString());
}

export function calculateTransactionFees({
  gasUsed,
  effectiveGasPrice,
  blobGasUsed,
  blobGasPrice,
  baseFeePerGas,
}: {
  gasUsed: Amount;
  effectiveGasPrice: Amount;
  blobGasUsed: Amount;
  blobGasPrice: Amount;
  baseFeePerGas: Amount;
}) {
  const executionFee =
    gasUsed != null && effectiveGasPrice != null
      ? toInteger(gasUsed) * toInteger(effectiveGasPrice)
      : null;
  const blobFee =
    blobGasUsed != null && blobGasPrice != null
      ? toInteger(blobGasUsed) * toInteger(blobGasPrice)
      : null;
  const executionBaseFee =
    gasUsed != null && baseFeePerGas != null
      ? toInteger(gasUsed) * toInteger(baseFeePerGas)
      : null;
  return {
    executionFee: executionFee?.toString() ?? null,
    totalFee:
      executionFee !== null && blobFee !== null
        ? (executionFee + blobFee).toString()
        : null,
    executionBaseFee: executionBaseFee?.toString() ?? null,
    priorityFee:
      executionFee !== null && executionBaseFee !== null
        ? (executionFee - executionBaseFee).toString()
        : null,
  };
}
