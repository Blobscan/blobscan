import { beforeAll, describe, expect, it } from "vitest";

import { Prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { appRouter } from "../src/app-router";
import type { TRPCContext } from "../src/context";
import { createTestContext } from "./helpers";

describe("getAppState", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    caller = appRouter.createCaller(ctx);
  });

  it("should return the sync state", async () => {
    const { syncState } = await caller.state.getAppState();

    const expectedState = {
      ...fixtures.blockchainSyncState[0],
      ...fixtures.blobStoragesState[0],
    };

    delete expectedState?.id;
    delete expectedState?.lastUpperSyncedBlockRoot;
    delete expectedState?.lastUpperSyncedBlockSlot;
    delete expectedState?.updatedAt;

    expect(syncState).toMatchObject(expectedState);
  });

  it("should return the latest block", async () => {
    const { blocks } = await caller.state.getAppState();

    const latestBlock =
      fixtures.canonicalBlocks[fixtures.canonicalBlocks.length - 1];

    const expectedLatestBlock = latestBlock
      ? {
          number: latestBlock.number,
          slot: latestBlock.slot,
          timestamp: new Date(latestBlock.timestamp),
          blobGasPrice: new Prisma.Decimal(latestBlock.blobGasPrice),
        }
      : {};

    expect(blocks?.latest).toMatchObject(expectedLatestBlock);
  });

  it("should return the 24h-ago block", async () => {
    const { blocks } = await caller.state.getAppState();

    expect(blocks?.past24h).toBeUndefined();
  });

  it("should not return a 24h-ago block older than the allowed stale margin", async () => {
    const { blocks } = await caller.state.getAppState();

    expect(blocks?.past24h).toBeUndefined();
  });
});
