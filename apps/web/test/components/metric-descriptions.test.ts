import { describe, expect, it } from "vitest";

import { getMetricDescription } from "~/components/Address/metric-descriptions";

describe("getMetricDescription", () => {
  describe("when the card name has a role", () => {
    it("should return the text of the name without the role", () => {
      expect(getMetricDescription("Total Blob Txs")).toBeDefined();
      expect(getMetricDescription("Total Blob Txs (As Sender)")).toBe(
        getMetricDescription("Total Blob Txs")
      );
      expect(getMetricDescription("Total Blobs (As Receiver)")).toBe(
        getMetricDescription("Total Blobs")
      );
    });
  });

  describe("when the card is an activity card", () => {
    it("should return a text", () => {
      expect(getMetricDescription("Longest Gap")).toMatch(/days/);
    });
  });

  describe("when the card name is unknown or not set", () => {
    it("should return undefined", () => {
      expect(getMetricDescription("Unknown Metric")).toBeUndefined();
      expect(getMetricDescription(undefined)).toBeUndefined();
    });
  });
});
