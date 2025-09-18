import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import { createTestContext } from "../helpers";
import { createBlockchainSyncStateCaller } from "./caller";
import type { BlockchainSyncStateCaller } from "./caller";

describe("getState", () => {
  let caller: BlockchainSyncStateCaller;

  beforeAll(async () => {
    const ctx = await createTestContext();

    caller = createBlockchainSyncStateCaller(ctx);
  });

  it("should get blockchain sync state", async () => {
    const result = await caller.getState();
    const expectedState = {
      ...fixtures.blockchainSyncState[0],
    };
    delete expectedState?.id;

    expect(result).toMatchObject(expectedState);
  });
});
