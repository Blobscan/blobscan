import { z } from "zod";

// We use this workaround instead of z.coerce.boolean.default(false)
// because it considers as "true" any value different than "false"
// (including the empty string).
export const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

/**
 * The time frames of the stats.
 */
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
export const metricsGranularitySchema = z.enum([
  "hour",
  "day",
  "week",
  "month",
  "year",
]);

export type MetricsGranularity = z.infer<typeof metricsGranularitySchema>;
