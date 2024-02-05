import { describe, expect, it } from "vitest";

import { appRouter } from "../src/app-router";
import { createTestContext } from "./helpers";

describe("Blockchain sync state route", async () => {
  describe("getBlockchainSyncState", () => {
    it("should get blockchain sync state", async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.syncState.getBlockchainSyncState();
      expect(result).toMatchSnapshot();
    });
  });
});
