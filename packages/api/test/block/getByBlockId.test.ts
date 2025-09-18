import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import type { getByBlockId } from "../../src/routers/block/getByBlockId";
import { createTestContext, runExpandsTestsSuite } from "../helpers";
import type { BlockCaller } from "./caller";
import { createBlockCaller } from "./caller";

describe("getByBlockId", () => {
  let blockCaller: BlockCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blockCaller = createBlockCaller(ctx);
  });

  it("should get a block by hash", async () => {
    const result = await blockCaller.getByBlockId({
      id: "0x00903f147f44929cdb385b595b2e745566fe50658362b4e3821fa52b5ebe8f06",
    });

    expect(result).toMatchSnapshot();
  });

  it("should get a block by block number", async () => {
    type Input = inferProcedureInput<typeof getByBlockId>;
    const input: Input = {
      id: "1002",
    };

    const result = await blockCaller.getByBlockId(input);

    expect(result).toMatchSnapshot();
  });

  it("should get latest block", async () => {
    const result = await blockCaller.getByBlockId({
      id: "latest",
    });

    expect(result).toMatchSnapshot();
  });

  it("should get oldest block", async () => {
    const result = await blockCaller.getByBlockId({
      id: "oldest",
    });

    expect(result).toMatchSnapshot();
  });

  it("should get a reorged block by block number", async () => {
    const result = await blockCaller.getByBlockId({
      id: "1008",
      type: "reorged",
    });

    expect(result).toMatchSnapshot();
  });

  it("should get the canonical block when providing a block number matching a reorged block", async () => {
    const result = await blockCaller.getByBlockId({
      id: "1008",
    });

    expect(result).toMatchSnapshot();
  });

  runExpandsTestsSuite("block", ["transaction", "blob"], (expandInput) =>
    blockCaller.getByBlockId({ id: "1002", ...expandInput })
  );

  it("should fail when trying to get a block with an invalid hash", async () => {
    await expect(
      blockCaller.getByBlockId({
        id: "invalidHash",
      })
    ).rejects.toThrow();
  });

  it("should fail when trying to get a block with a non-existent hash", async () => {
    const invalidHash =
      "0x0132d67fc77e26737632ebda918c689f146196dcd0dc5eab95ab7875cef95ef9";
    await expect(
      blockCaller.getByBlockId({
        id: invalidHash,
      })
    ).rejects.toThrow(
      new TRPCError({
        code: "NOT_FOUND",
        message: `Block with id "${invalidHash}" not found`,
      })
    );
  });

  it("should fail when trying to get a block with a non-existent block number", async () => {
    await expect(
      blockCaller.getByBlockId({
        id: "9999",
      })
    ).rejects.toThrow(
      new TRPCError({
        code: "NOT_FOUND",
        message: 'Block with id "9999" not found',
      })
    );
  });
});
