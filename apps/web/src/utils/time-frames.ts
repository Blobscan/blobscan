import type { MetricsGranularity, TimeFrame } from "@blobscan/zod";

// A copy of the time frame rules of the API (packages/api/src/time-frames.ts).
// When you change them, change the API too.

const TIME_FRAME_DAYS = {
  "1d": 1,
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
} satisfies Record<Exclude<TimeFrame, "All">, number>;

/**
 * Returns the number of days of the time frame. `All` has no fixed number of
 * days.
 */
export function getTimeFrameDays(timeFrame: Exclude<TimeFrame, "All">) {
  return TIME_FRAME_DAYS[timeFrame];
}

type TimeFrameGranularities = {
  default: MetricsGranularity;
  options: readonly MetricsGranularity[];
};

// A time frame allows the granularities that give a good number of periods:
// at least about 4, and at most about 1000 for a line. A categorized
// timeseries (split by category or rollup) shows as stacked bars, with up to
// one segment for each rollup in each bar. Thus it allows at most about 200
// periods. `All` also allows years, because it is the only time frame that
// can have more than one year. `All` has no fixed number of days, and its
// number of days increases each day. Thus its default granularity is a week,
// also for a line.
const GLOBAL_GRANULARITIES = {
  "1d": { default: "hour", options: ["hour"] },
  "7d": { default: "hour", options: ["hour", "day"] },
  "15d": { default: "day", options: ["hour", "day"] },
  "30d": { default: "day", options: ["hour", "day", "week"] },
  "90d": { default: "day", options: ["day", "week"] },
  "180d": { default: "day", options: ["day", "week", "month"] },
  "365d": { default: "day", options: ["day", "week", "month"] },
  All: { default: "week", options: ["day", "week", "month", "year"] },
} satisfies Record<TimeFrame, TimeFrameGranularities>;

const CATEGORIZED_GRANULARITIES = {
  "1d": { default: "hour", options: ["hour"] },
  "7d": { default: "day", options: ["hour", "day"] },
  "15d": { default: "day", options: ["day"] },
  "30d": { default: "day", options: ["day", "week"] },
  "90d": { default: "week", options: ["day", "week"] },
  "180d": { default: "week", options: ["day", "week", "month"] },
  "365d": { default: "week", options: ["week", "month"] },
  All: { default: "week", options: ["week", "month", "year"] },
} satisfies Record<TimeFrame, TimeFrameGranularities>;

/**
 * Returns the granularities that the time frame allows, from the shortest to
 * the longest, and the default granularity. No time frame is the same as
 * `All`.
 */
export function getTimeFrameGranularities(
  timeFrame: TimeFrame | undefined,
  { isCategorized }: { isCategorized: boolean }
): TimeFrameGranularities {
  const granularities = isCategorized
    ? CATEGORIZED_GRANULARITIES
    : GLOBAL_GRANULARITIES;

  return granularities[timeFrame ?? "All"];
}

/**
 * Returns the default granularity of the time frame.
 */
export function getTimeFrameGranularity(
  timeFrame: TimeFrame | undefined,
  options: { isCategorized: boolean }
): MetricsGranularity {
  return getTimeFrameGranularities(timeFrame, options).default;
}

/**
 * Returns true when the time frame allows the granularity.
 */
export function isTimeFrameGranularity(
  granularity: MetricsGranularity,
  timeFrame: TimeFrame | undefined,
  options: { isCategorized: boolean }
) {
  return getTimeFrameGranularities(timeFrame, options).options.includes(
    granularity
  );
}
