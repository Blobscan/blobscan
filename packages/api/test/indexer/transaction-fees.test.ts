import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createTransactionCaller } from "../tx/caller";
import { createIndexerCaller } from "./caller";
import { INPUT } from "./fixtures";

const feeInput = {
  ...INPUT,
  block: { ...INPUT.block, baseFeePerGas: "0x77359400" },
  transactions: INPUT.transactions.map((tx, i) => ({
    ...tx,
    from: INPUT.transactions[0]!.from,
    executionStatus: i === 0 ? ("failed" as const) : ("success" as const),
    gasUsed: "0x5208",
    effectiveGasPrice: "3000000000",
    input: i === 0 ? "0x001234" : "0x",
  })),
};

describe("Transaction fee ingestion and responses", () => {
  let ctx: TRPCContext;
  beforeAll(async () => {
    ctx = await createTestContext({
      apiClient: "indexer",
      withBlobPropagator: true,
    });
  });

  it("returns exact fees and calldata after ingestion", async () => {
    await createIndexerCaller(ctx).indexData(feeInput);
    const caller = createTransactionCaller(ctx);
    const tx = await caller.getByHash({ hash: feeInput.transactions[0]!.hash });
    expect(tx.executionStatus).toBe("failed");
    expect(tx.gasUsed).toBe(21000n);
    expect(tx.effectiveGasPrice).toBe(3000000000n);
    expect(tx.executionFee).toBe(63000000000000n);
    expect(tx.executionBaseFee).toBe(42000000000000n);
    expect(tx.priorityFee).toBe(21000000000000n);
    expect(tx.totalFee).toBe(tx.executionFee! + tx.blobGasBaseFee);
    expect(tx.input).toBe("0x001234");
    const empty = await caller.getByHash({
      hash: feeInput.transactions[1]!.hash,
    });
    expect(empty.executionStatus).toBe("success");
    expect(empty.input).toBe("0x");
    const next = await caller.getSenderAdjacentTx({
      hash: tx.hash,
      direction: "next",
    });
    expect(next?.input).toBe("0x");
    expect(next?.executionFee).toBe(empty.executionFee);
    const cursorList = await caller.getAllByCursor({});
    for (const row of cursorList.transactions)
      expect(row).not.toHaveProperty("input");
    const list = await caller.getAll({});
    expect(list.transactions.length).toBeGreaterThan(0);
    for (const row of list.transactions)
      expect(row).not.toHaveProperty("input");
  });

  it("keeps old indexer payloads readable and preserves new values on repeated ingestion", async () => {
    const indexer = createIndexerCaller(ctx);
    const caller = createTransactionCaller(ctx);
    await indexer.indexData(INPUT);
    const old = await caller.getByHash({ hash: INPUT.transactions[0]!.hash });
    expect(old.executionStatus).toBeNull();
    expect(old.totalFee).toBeNull();
    expect(old.input).toBeNull();
    await indexer.indexData(feeInput);
    await indexer.indexData(INPUT);
    const updated = await caller.getByHash({
      hash: INPUT.transactions[0]!.hash,
    });
    expect(updated.executionStatus).toBe("failed");
    expect(updated.executionFee).toBe(63000000000000n);
    expect(updated.priorityFee).toBe(21000000000000n);
    expect(updated.input).toBe("0x001234");
  });

  it("preserves zero fees and integer precision", async () => {
    await createIndexerCaller(ctx).indexData({
      ...feeInput,
      block: { ...feeInput.block, baseFeePerGas: "0" },
      transactions: feeInput.transactions.map((tx, i) => ({
        ...tx,
        effectiveGasPrice: i === 0 ? "0" : "1000000000000000000000",
      })),
    });
    const caller = createTransactionCaller(ctx);
    const zero = await caller.getByHash({ hash: INPUT.transactions[0]!.hash });
    expect(zero.executionFee).toBe(0n);
    expect(zero.priorityFee).toBe(0n);
    expect(zero.totalFee).toBe(zero.blobGasBaseFee);
    const large = await caller.getByHash({ hash: INPUT.transactions[1]!.hash });
    expect(large.executionFee).toBe(21000000000000000000000000n);
  });

  it.each(["-1", "1.5", "", "0x", "NaN"])(
    "rejects invalid gas quantity %s",
    async (gasUsed) => {
      await expect(
        createIndexerCaller(ctx).indexData({
          ...feeInput,
          transactions: [{ ...feeInput.transactions[0]!, gasUsed }],
        })
      ).rejects.toThrow();
    }
  );

  it.each(["0x1", "xyz", "0xgg"])(
    "rejects invalid calldata %s",
    async (input) => {
      await expect(
        createIndexerCaller(ctx).indexData({
          ...feeInput,
          transactions: [{ ...feeInput.transactions[0]!, input }],
        })
      ).rejects.toThrow();
    }
  );
});
