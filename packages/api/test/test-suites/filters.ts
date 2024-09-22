import { describe, it } from "vitest";

import type { FiltersSchema } from "../../src/middlewares/withFilters";

export function runFilterTests(
  assertFilters: (filters: FiltersSchema) => Promise<void>
) {
  describe("when using filters", () => {
    it("should return the correct results when filtering by a specific rollup", async () => {
      await assertFilters({
        rollup: "optimism",
      });
    });

    it("should return the correct results when filtering by a 'null' rollup", async () => {
      await assertFilters({
        rollup: "null",
      });
    });

    it("should return the correct results when filtering by a start block", async () => {
      await assertFilters({
        startBlock: 1007,
      });
    });

    it("should return the correct results when filtering by an end block", async () => {
      await assertFilters({
        endBlock: 1002,
      });
    });

    it("should return the correct results when filtering by a block range", async () => {
      await assertFilters({
        startBlock: 1004,
        endBlock: 1006,
      });
    });

    it("should return the correct results when filtering by a start date", async () => {
      await assertFilters({
        startDate: new Date("2023-08-31"),
      });
    });

    it("should return the correct results when filtering by an end date date", async () => {
      await assertFilters({
        endDate: new Date("2022-12-01"),
      });
    });

    it("should return the correct results when filtering by a date range", async () => {
      await assertFilters({
        startDate: new Date("2023-08-03"),
        endDate: new Date("2023-08-28"),
      });
    });

    it("should return the correct results when filtering by a start slot", async () => {
      await assertFilters({
        startSlot: 107,
      });
    });

    it("should return the correct results when filtering by an end slot", async () => {
      await assertFilters({
        endSlot: 102,
      });
    });

    it("should return the correct results when filtering by a sender", async () => {
      await assertFilters({
        from: "address1",
      });
    });

    it("should return the correct results when filtering by a receiver", async () => {
      await assertFilters({
        to: "address2",
      });
    });

    it("should return the correct results when filtering by a sender or receiver", async () => {
      await assertFilters({
        from: "address1",
        to: "address2",
      });
    });

    it("should return the correct results when filtering by reorged blocks", async () => {
      await assertFilters({
        type: "reorged",
      });
    });
  });
}
