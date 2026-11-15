import { describe, expect, it } from "vitest";

import { getBlockBlobTransactionFees } from "../src/utils/block-fees";

const block = {
  baseFeePerGas: 2n,
  blobGasUsed: 262144n,
  blobGasPrice: 1n,
  transactions: [
    { gasUsed: 21000n, effectiveGasPrice: 3n, blobGasUsed: 131072n },
    { gasUsed: 10000n, effectiveGasPrice: 4n, blobGasUsed: 131072n },
  ],
};

describe("block blob transaction fees", () => {
  it("sums fees without counting priority twice", () => {
    expect(getBlockBlobTransactionFees(block)).toEqual({
      executionBaseFee: 62000n,
      priorityFee: 41000n,
      blobFee: 262144n,
      totalFee: 365144n,
    });
  });
  it("rejects missing receipt data", () => {
    expect(
      getBlockBlobTransactionFees({
        ...block,
        transactions: [
          block.transactions[0]!,
          { ...block.transactions[1]!, gasUsed: null },
        ],
      })
    ).toBeNull();
  });
  it("rejects incomplete transaction coverage", () => {
    expect(
      getBlockBlobTransactionFees({
        ...block,
        transactions: block.transactions.slice(0, 1),
      })
    ).toBeNull();
  });
  it("rejects missing base fees", () => {
    expect(
      getBlockBlobTransactionFees({ ...block, baseFeePerGas: null })
    ).toBeNull();
  });
  it("retains zero fees", () => {
    expect(
      getBlockBlobTransactionFees({
        ...block,
        baseFeePerGas: 0n,
        transactions: block.transactions.map((tx) => ({
          ...tx,
          effectiveGasPrice: 0n,
        })),
      })
    ).toEqual({
      executionBaseFee: 0n,
      priorityFee: 0n,
      blobFee: 262144n,
      totalFee: 262144n,
    });
  });
});
