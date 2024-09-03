import { describe, expect, test } from "vitest";

import { formatTtl } from "../index";

const ONE_MINUTE = 60;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_YEAR = 52 * ONE_WEEK;

describe("formatTtl", () => {
  test("should format seconds correctly", () => {
    expect(formatTtl(0)).toBe("0 seconds");
    expect(formatTtl(3)).toBe("3 seconds");
    expect(formatTtl(59)).toBe("59 seconds");
    expect(formatTtl(119)).toBe("119 seconds");
    expect(formatTtl(120)).toBe("2 minutes");
  });

  test("should format minutes correctly", () => {
    expect(formatTtl(ONE_MINUTE * 3)).toBe("3 minutes");
    expect(formatTtl(ONE_MINUTE * 59)).toBe("59 minutes");
    expect(formatTtl(ONE_MINUTE * 119)).toBe("119 minutes");
    expect(formatTtl(ONE_MINUTE * 120)).toBe("2 hours");
  });

  test("should format hours correctly", () => {
    expect(formatTtl(ONE_HOUR * 3)).toBe("3 hours");
    expect(formatTtl(ONE_HOUR * 47)).toBe("47 hours");
    expect(formatTtl(ONE_HOUR * 48)).toBe("2 days");
  });

  test("should format days correctly", () => {
    expect(formatTtl(ONE_DAY * 3)).toBe("3 days");
    expect(formatTtl(ONE_DAY * 13)).toBe("13 days");
    expect(formatTtl(ONE_DAY * 14)).toBe("2 weeks");
  });

  test("should format weeks correctly", () => {
    expect(formatTtl(ONE_WEEK * 3)).toBe("3 weeks");
    expect(formatTtl(ONE_WEEK * 51)).toBe("51 weeks");
    expect(formatTtl(ONE_WEEK * 52)).toBe("1.0 years");
  });

  test("should format years correctly", () => {
    expect(formatTtl(ONE_YEAR * 3)).toBe("3.0 years");
    expect(formatTtl(ONE_YEAR * 3.5)).toBe("3.5 years");
    expect(formatTtl(ONE_YEAR * 3.75)).toBe("3.8 years");
    expect(formatTtl(ONE_YEAR * 30.75)).toBe("30.8 years");
  });
});
