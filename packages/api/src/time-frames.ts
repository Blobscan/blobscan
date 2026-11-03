import { z } from "@blobscan/zod";

// This module imports only zod, so the web client can import it too.

export const timeFrameSchema = z.enum([
  "1d",
  "7d",
  "15d",
  "30d",
  "90d",
  "180d",
  "365d",
  "All",
]);

export type TimeFrame = z.infer<typeof timeFrameSchema>;

/**
 * The length of one period of a timeseries. Each granularity has its own
 * metrics table.
 */
export const metricsGranularitySchema = z.enum(["hour", "day", "week"]);

export type MetricsGranularity = z.infer<typeof metricsGranularitySchema>;

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

/**
 * Returns the granularity that gives a good number of points for the time
 * frame. A short time frame uses hours.
 *
 * A categorized timeseries (split by category or rollup) shows as stacked
 * bars, which need fewer points than a line. It uses weeks for the time
 * frames longer than 90 days. A global timeseries uses days.
 */
export function getTimeFrameGranularity(
  timeFrame: TimeFrame | undefined,
  { isCategorized }: { isCategorized: boolean }
): MetricsGranularity {
  switch (timeFrame) {
    case "1d":
    case "7d":
      return "hour";
    case "180d":
    case "365d":
    case "All":
    case undefined:
      return isCategorized ? "week" : "day";
    default:
      return "day";
  }
}
