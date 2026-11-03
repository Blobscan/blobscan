import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { formatTimeValue } from "~/components/Charts/ChartBase/helpers/formatters";

// A Monday, the start of a week in UTC. In New York, it is still Sunday.
const WEEK_START = new Date("2026-11-02T00:00:00.000Z");
const HOUR_START = new Date("2026-11-02T14:00:00.000Z");

describe("formatTimeValue", () => {
  // A timezone west of UTC shows the local date of a period as the day
  // before.
  beforeAll(() => {
    vi.stubEnv("TZ", "America/New_York");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("should show the UTC date of a week", () => {
    expect(formatTimeValue(WEEK_START, false, "week")).toBe(
      "Week of Monday, November, 02 2026"
    );
    expect(formatTimeValue(WEEK_START, true, "week")).toBe("Nov 02");
  });

  it("should show the UTC date of a day", () => {
    expect(formatTimeValue(WEEK_START, false, "day")).toBe(
      "Monday, November, 02 2026"
    );
    expect(formatTimeValue(WEEK_START, true)).toBe("Nov 02");
  });

  it("should show the UTC time of an hour", () => {
    expect(formatTimeValue(HOUR_START, false, "hour")).toBe(
      "Monday, November, 02 2026, 14:00 UTC"
    );
    expect(formatTimeValue(HOUR_START, true, "hour")).toBe("Nov 02 14:00");
  });
});
