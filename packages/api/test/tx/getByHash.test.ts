import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext, runExpandsTestsSuite } from "../helpers";
import type { TxCaller } from "./caller";
import { createTransactionCaller } from "./caller";

describe("getByHash", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  runExpandsTestsSuite("transaction", ["block", "blob"], (expandsInput) =>
    txCaller.getByHash({ hash: "txHash001", ...expandsInput })
  );

  it("should get a transaction by hash correctly", async () => {
    const result = await txCaller.getByHash({
      hash: "txHash001",
    });

    expect(result).toMatchSnapshot();
  });

  it("should fail when providing a non-existent hash", async () => {
    await expect(
      txCaller.getByHash({
        hash: "nonExistingHash",
      })
    ).rejects.toMatchSnapshot(
      "[TRPCError: No transaction with hash 'nonExistingHash' found]"
    );
  });
});
