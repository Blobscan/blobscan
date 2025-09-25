import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext, runExpandsTestsSuite } from "../helpers";
import type { BlockCaller } from "./caller";
import { createBlockCaller } from "./caller";

describe("getAdjacentBlock", () => {
  let ctx: TRPCContext;
  let caller: BlockCaller;
  const blockNumber = 1004;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = createBlockCaller(ctx);
  });

  runExpandsTestsSuite("block", ["transaction", "blob"], (expandInput) =>
    caller.getAdjacentBlock({
      blockNumber: 1004,
      direction: "next",
      ...expandInput,
    })
  );

  it("should get a previous block", async () => {
    const previousBlock = await caller.getAdjacentBlock({
      blockNumber,
      direction: "prev",
    });

    expect(previousBlock).toMatchSnapshot();
  });

  it("should get a next block", async () => {
    const nextBlock = await caller.getAdjacentBlock({
      blockNumber,
      direction: "next",
    });

    expect(nextBlock).toMatchSnapshot();
  });

  it("should ignore reorged blocks", async () => {
    const nextBlock = await caller.getAdjacentBlock({
      blockNumber: 1007,
      direction: "next",
    });

    expect(nextBlock.hash).toBe(
      "0x8000000000000000000000000000000000000000000000000000000000000000"
    );
  });

  testValidError(
    "should fail when no adjacent block was found",
    async () => {
      await caller.getAdjacentBlock({
        blockNumber: 1001,
        direction: "prev",
      });
    },
    TRPCError,
    {
      checkCause: true,
    }
  );
});
