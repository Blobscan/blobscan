import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { TxCaller } from "./caller";
import { createTransactionCaller } from "./caller";

describe("getAdjacentsByAddress", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  it("should return the previous and next transactions of the sender", async () => {
    const result = await txCaller.getAdjacentsByAddress({
      hash: "txHash012",
    });

    expect(result).toEqual({
      prevTxHash: "txHash007",
      nextTxHash: "txHash015",
    });
  });

  it("should not return a previous transaction for the first transaction of the sender", async () => {
    const { prevTxHash, nextTxHash } = await txCaller.getAdjacentsByAddress({
      hash: "txHash003",
    });

    expect(prevTxHash).toBeUndefined();
    expect(nextTxHash).toBe("txHash007");
  });

  it("should ignore reorged transactions", async () => {
    const { prevTxHash, nextTxHash } = await txCaller.getAdjacentsByAddress({
      hash: "txHash015",
    });

    expect(prevTxHash).toBe("txHash012");
    expect(nextTxHash).toBeUndefined();
  });

  it("should not return adjacent transactions for an unknown transaction", async () => {
    const result = await txCaller.getAdjacentsByAddress({
      hash: "unknownTxHash",
    });

    expect(result).toEqual({
      prevTxHash: undefined,
      nextTxHash: undefined,
    });
  });
});
