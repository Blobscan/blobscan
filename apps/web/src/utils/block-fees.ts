type FeeTransaction = {
  gasUsed?: bigint | null;
  effectiveGasPrice?: bigint | null;
  blobGasUsed?: bigint | null;
};

export function getBlockBlobTransactionFees(block: {
  baseFeePerGas?: bigint | null;
  blobGasUsed: bigint;
  blobGasPrice: bigint;
  transactions: FeeTransaction[];
}) {
  if (block.baseFeePerGas == null) return null;

  let storedBlobGas = 0n;
  let executionBaseFee = 0n;
  let priorityFee = 0n;
  for (const tx of block.transactions) {
    if (
      tx.gasUsed == null ||
      tx.effectiveGasPrice == null ||
      tx.blobGasUsed == null
    )
      return null;

    storedBlobGas += tx.blobGasUsed;
    executionBaseFee += tx.gasUsed * block.baseFeePerGas;
    priorityFee += tx.gasUsed * (tx.effectiveGasPrice - block.baseFeePerGas);
  }
  if (storedBlobGas !== block.blobGasUsed) return null;

  const blobFee = storedBlobGas * block.blobGasPrice;
  return {
    totalFee: executionBaseFee + priorityFee + blobFee,
    executionBaseFee,
    priorityFee,
    blobFee,
  };
}
