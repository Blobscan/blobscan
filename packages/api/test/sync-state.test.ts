import { describe, expect, it } from "vitest";

import { getCaller } from "./helper";

describe("Sync state route", async () => {
  describe("getSyncState", () => {
    it("should get sync state", async () => {
      const caller = await getCaller();
      const result = await caller.syncState.getSyncState();
      expect(result).toMatchSnapshot();
    });
  });
});
