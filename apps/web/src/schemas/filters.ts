import { z } from "@blobscan/zod";

import {
  allSchema,
  blockNumberSchema,
  categorySchema,
  createCommaSeparatedParam,
  dateSchema,
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

export const filterParamsSchema = z
  .object({})
  .merge(blockParamsSchema)
  .merge(slotParamsSchema)
  .merge(rollupsSchema)
  .merge(categoriesParamSchema)
  .merge(dateParamsSchema)
  .partial();

export type CategoriesParam = z.infer<typeof categoriesSchema>;
export type RollupsParam = z.infer<typeof rollupsFieldSchema>;

export type FiltersParam = z.infer<typeof filterParamsSchema>;
