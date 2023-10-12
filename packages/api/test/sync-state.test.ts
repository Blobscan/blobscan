import { describe, expect, it } from "vitest";

import { appRouter } from "../src/root";
import { getContext } from "./helpers";

describe("Sync state route", async () => {
  describe("getState", () => {
    it("should get sync state", async () => {
      const ctx = await getContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.syncState.getState();
      expect(result).toMatchSnapshot();
    });
  });
});
