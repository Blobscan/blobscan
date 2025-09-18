import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { BlockCaller } from "./caller";
import { createBlockCaller } from "./caller";

describe("checkBlockExists", () => {
  let blockCaller: BlockCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blockCaller = createBlockCaller(ctx);
  });

  it("should return true for an existing block", async () => {
    const result = await blockCaller.checkBlockExists({
      blockNumber: 1002,
    });

    expect(result).toBe(true);
  });

  it("should return false for a non-existent block", async () => {
    const result = await blockCaller.checkBlockExists({
      blockNumber: 99999999,
    });

    expect(result).toBe(false);
  });
});
