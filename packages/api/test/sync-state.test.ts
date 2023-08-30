import { describe, expect, it } from "vitest";

import { getCaller } from "./helpers";

describe("Sync state route", async () => {
  const caller = await getCaller();

  describe("getSyncState", () => {
    it("should get sync state", async () => {
      const result = await caller.syncState.getSyncState();
      expect(result).toMatchSnapshot();
    });
  });
});
