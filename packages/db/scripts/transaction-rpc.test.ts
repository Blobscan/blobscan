import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateTransactionFees } from "../prisma/transaction-fees";
import { getTransactionData } from "./transaction-rpc";
import type { RpcCall } from "./transaction-rpc";

const stored = {
  hash: `0x${"1".repeat(64)}`,
  blockHash: `0x${"2".repeat(64)}`,
  blockNumber: 100,
  blobGasUsed: "131072",
  block: { blobGasPrice: "3" },
};
function fixture() {
  return {
    eth_getTransactionByHash: {
      hash: stored.hash,
      blockHash: stored.blockHash,
      blockNumber: "0x64",
      input: "0x001234",
    },
    eth_getTransactionReceipt: {
      transactionHash: stored.hash,
      blockHash: stored.blockHash,
      blockNumber: "0x64",
      gasUsed: "0x5208",
      effectiveGasPrice: "0xb2d05e00",
      blobGasUsed: "0x20000",
      blobGasPrice: "0x3",
      status: "0x0",
    },
    eth_getBlockByNumber: {
      hash: stored.blockHash,
      number: "0x64",
      baseFeePerGas: "0x77359400",
    },
  };
}
function mockRpc(data: ReturnType<typeof fixture>): RpcCall {
  return async (method) => data[method as keyof typeof data];
}

test("reads fees for a failed transaction and keeps calldata bytes", async () => {
  assert.deepEqual(await getTransactionData(mockRpc(fixture()), stored), {
    executionStatus: "FAILED",
    gasUsed: "21000",
    effectiveGasPrice: "3000000000",
    input: "0x001234",
    baseFeePerGas: "2000000000",
  });
});

test("rejects a receipt from another block", async () => {
  const data = fixture();
  data.eth_getTransactionReceipt.blockHash = `0x${"3".repeat(64)}`;
  await assert.rejects(
    getTransactionData(mockRpc(data), stored),
    /does not match/
  );
});

test("rejects a changed canonical block", async () => {
  const data = fixture();
  data.eth_getBlockByNumber.hash = `0x${"3".repeat(64)}`;
  await assert.rejects(
    getTransactionData(mockRpc(data), stored),
    /does not match/
  );
});

test("rejects missing receipts and invalid calldata", async () => {
  await assert.rejects(
    getTransactionData(async () => null, stored),
    /unavailable/
  );
  const data = fixture();
  data.eth_getTransactionByHash.input = "0x1";
  await assert.rejects(
    getTransactionData(mockRpc(data), stored),
    /Invalid transaction input/
  );
});

test("rejects inconsistent blob fees", async () => {
  const data = fixture();
  data.eth_getTransactionReceipt.blobGasPrice = "0x4";
  await assert.rejects(getTransactionData(mockRpc(data), stored), /Blob gas/);
});

test("accepts empty calldata and a zero gas price", async () => {
  const data = fixture();
  data.eth_getTransactionByHash.input = "0x";
  data.eth_getTransactionReceipt.effectiveGasPrice = "0x0";
  data.eth_getBlockByNumber.baseFeePerGas = "0x0";
  const result = await getTransactionData(mockRpc(data), stored);
  assert.equal(result.input, "0x");
  assert.equal(result.effectiveGasPrice, "0");
});

test("adds execution and blob fees without adding the tip twice", () => {
  assert.deepEqual(
    calculateTransactionFees({
      gasUsed: "21000",
      effectiveGasPrice: "3000000000",
      blobGasUsed: "131072",
      blobGasPrice: "3",
      baseFeePerGas: "2000000000",
    }),
    {
      executionFee: "63000000000000",
      totalFee: "63000000393216",
      executionBaseFee: "42000000000000",
      priorityFee: "21000000000000",
    }
  );
});

test("keeps missing fees null and zero fees zero", () => {
  const fields = {
    gasUsed: null,
    effectiveGasPrice: "0",
    blobGasUsed: "0",
    blobGasPrice: "0",
    baseFeePerGas: "0",
  };
  assert.equal(calculateTransactionFees(fields).totalFee, null);
  assert.equal(
    calculateTransactionFees({ ...fields, gasUsed: "0" }).totalFee,
    "0"
  );
});

test("keeps integer precision above the safe number range", () => {
  const gasUsed = "9007199254740993";
  assert.equal(
    calculateTransactionFees({
      gasUsed,
      effectiveGasPrice: "3",
      blobGasUsed: "1",
      blobGasPrice: "1",
      baseFeePerGas: null,
    }).totalFee,
    "27021597764222980"
  );
});

test("accepts decimal values that use exponential notation", () => {
  const amount = {
    toString: () => "1e+21",
    toFixed: () => "1000000000000000000000",
  };
  assert.equal(
    calculateTransactionFees({
      gasUsed: "1",
      effectiveGasPrice: amount,
      blobGasUsed: "0",
      blobGasPrice: "0",
      baseFeePerGas: null,
    }).totalFee,
    "1000000000000000000000"
  );
});

test("compares large stored blob prices without exponential notation", async () => {
  const data = fixture();
  data.eth_getTransactionReceipt.blobGasPrice = `0x${(10n ** 21n).toString(
    16
  )}`;
  const price = {
    toString: () => "1e+21",
    toFixed: () => "1000000000000000000000",
  };
  const result = await getTransactionData(mockRpc(data), {
    ...stored,
    block: { blobGasPrice: price },
  });
  assert.equal(result.gasUsed, "21000");
});

test("reads successful execution status", async () => {
  const data = fixture();
  data.eth_getTransactionReceipt.status = "0x1";
  assert.equal(
    (await getTransactionData(mockRpc(data), stored)).executionStatus,
    "SUCCESS"
  );
});

test("rejects missing and invalid execution status", async () => {
  for (const status of [undefined, null, "0x2"]) {
    const data = fixture();
    const rpc: RpcCall = async (method) =>
      method === "eth_getTransactionReceipt"
        ? { ...data.eth_getTransactionReceipt, status }
        : data[method as keyof typeof data];
    await assert.rejects(getTransactionData(rpc, stored));
  }
});
