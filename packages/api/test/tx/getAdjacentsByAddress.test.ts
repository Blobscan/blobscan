import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { TxCaller } from "./caller";
import { createTransactionCaller } from "./caller";

describe("getAdjacentsByAddress", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;
  const address = "0x6887246668a3b87f54deb3b94ba47a6f63f32985";
  const blockTimestamp = new Date("2023-08-28T10:00:00Z");
  const index = 0;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  it("should return next transaction", async () => {
    const { nextTxHash } = await txCaller.getAdjacentsByAddress({
      senderAddress: address,
      blockTimestamp,
      txIndex: index,
    });

    expect(nextTxHash).toMatchInlineSnapshot('"txHash015"');
  });

  it("should return prev transaction", async () => {
    const { prevTxHash } = await txCaller.getAdjacentsByAddress({
      senderAddress: address,
      blockTimestamp,
      txIndex: index,
    });

    expect(prevTxHash).toMatchInlineSnapshot('"txHash007"');
  });

  it("should ignore reorged transactions", async () => {
    const { nextTxHash } = await txCaller.getAdjacentsByAddress({
      senderAddress: address,
      blockTimestamp: new Date("2023-08-31T14:00:00Z"),
      txIndex: 0,
    });

    expect(nextTxHash).toBeUndefined();
  });
});
