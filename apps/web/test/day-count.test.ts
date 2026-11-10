import { describe, expect, it } from "vitest";

import { formatDayCount } from "~/utils";

describe("formatDayCount", () => {
  describe("when the count is less than a year", () => {
    it("should show only the days", () => {
      expect(formatDayCount(0)).toBe("0 days");
      expect(formatDayCount(1)).toBe("1 day");
      expect(formatDayCount(364)).toBe("364 days");
    });
  });

  describe("when the count is a year or more", () => {
    it("should show the years and the remaining days", () => {
      expect(formatDayCount(400)).toBe("1 year, 35 days");
      expect(formatDayCount(731)).toBe("2 years, 1 day");
    });

    it("should show only the years when no days remain", () => {
      expect(formatDayCount(365)).toBe("1 year");
      expect(formatDayCount(730)).toBe("2 years");
    });
  });
});
