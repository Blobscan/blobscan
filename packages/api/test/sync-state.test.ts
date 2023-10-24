import { describe, expect, it } from "vitest";

import { appRouter } from "../src/app-router";
import { createTestContext } from "./helpers";

describe("Sync state route", async () => {
  describe("getState", () => {
    it("should get sync state", async () => {
      const ctx = await createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.syncState.getState();
      expect(result).toMatchSnapshot();
    });
  });
});
