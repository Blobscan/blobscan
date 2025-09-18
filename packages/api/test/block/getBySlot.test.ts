import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createBlockCaller } from "./caller";
import type { BlockCaller } from "./caller";

describe("getBySlot", () => {
  let blockCaller: BlockCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blockCaller = createBlockCaller(ctx);
  });

  it("should get a block by slot", async () => {
    const result = await blockCaller.getBySlot({
      slot: 101,
    });

    expect(result).toMatchSnapshot();
  });

  testValidError(
    "should fail when trying to get a reorged block by slot",
    async () => {
      await blockCaller.getBySlot({
        slot: 110,
      });
    },
    TRPCError
  );

  testValidError(
    "should fail when trying to get a block with a negative slot",
    async () => {
      await blockCaller.getBySlot({
        slot: -1,
      });
    },
    TRPCError,
    {
      checkCause: true,
    }
  );
});
