import { timeFrameSchema } from "@blobscan/api/src/time-frames";
import { z } from "@blobscan/zod";

import {
  allSchema,
  blockNumberSchema,
  categorySchema,
  createCommaSeparatedParam,
  dateSchema,
  epochSchema,
  rollupSchema,
  slotSchema,
} from "./utils";

export const rollupsFieldSchema = createCommaSeparatedParam(
  rollupSchema.or(allSchema)
);
export const categoriesSchema = createCommaSeparatedParam(
  categorySchema.or(allSchema)
);

export const rollupsSchema = z.object({
  rollups: rollupsFieldSchema,
});

export const categoriesParamSchema = z.object({
  categories: categoriesSchema,
});

// The time frames of the chart pages. See getTimeFrameGranularity in
// @blobscan/api for the length of their periods.
export const chartTimeFrameSchema = timeFrameSchema.extract([
  "1d",
  "7d",
  "30d",
  "90d",
  "365d",
  "All",
]);

export const timeFrameParamSchema = z.object({
  timeFrame: chartTimeFrameSchema.optional(),
});

export const dateParamsSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

export const blockParamsSchema = z.object({
  startBlock: blockNumberSchema,
  endBlock: blockNumberSchema,
});

export const slotParamsSchema = z.object({
  startSlot: slotSchema,
  endSlot: slotSchema,
});

export const epochParamsSchema = z.object({
  startEpoch: epochSchema,
  endEpoch: epochSchema,
});

export const filterParamsSchema = z
  .object({})
  .merge(blockParamsSchema)
  .merge(slotParamsSchema)
  .merge(epochParamsSchema)
  .merge(rollupsSchema)
  .merge(categoriesParamSchema)
  .merge(dateParamsSchema)
  .partial();

export type CategoriesParam = z.infer<typeof categoriesSchema>;
export type RollupsParam = z.infer<typeof rollupsFieldSchema>;

export type ChartTimeFrame = z.infer<typeof chartTimeFrameSchema>;

export type FiltersParam = z.infer<typeof filterParamsSchema>;
