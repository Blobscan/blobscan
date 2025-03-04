import type { Prisma } from "@blobscan/db";
import type { Rollup } from "@blobscan/db/prisma/enums";
import { commaSeparatedValuesSchema, z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  addressSchema,
  blockNumberSchema,
  categorySchema,
  rollupSchema,
  slotSchema,
} from "../utils";

type NumberRangeFilter = {
  gte?: number;
  lte?: number;
};

type DateRangeFilter = {
  gte?: Date;
  lt?: Date;
};

export type FromAddressFilter = { in: string[] };

export type RollupFilter = {
  rollup: { in: Rollup[] } | null | { not: null };
};

export type ToAddressFilter = {
  toId: string;
};

export type Filters = Partial<{
  blockType: Prisma.TransactionForkListRelationFilter;
  blockFilters: Partial<{
    number: NumberRangeFilter;
    slot: NumberRangeFilter;
    timestamp: DateRangeFilter;
  }>;
  transactionFilters: Partial<{
    fromId: FromAddressFilter;
    toId: string;
    from: RollupFilter;
  }>;

  sort: Prisma.SortOrder;
}>;

const sortSchema = z.enum(["asc", "desc"]);

const typeSchema = z.enum(["reorged", "canonical"]);

export const withBlockRangeFilterSchema = z.object({
  startBlock: blockNumberSchema.optional(),
  endBlock: blockNumberSchema.optional(),
});

export const withSlotRangeFilterSchema = z.object({
  startSlot: slotSchema.optional(),
  endSlot: slotSchema.optional(),
});

export const withRollupsFilterSchema = z.object({
  rollups: commaSeparatedValuesSchema.transform((values) =>
    values?.map((v) => rollupSchema.parse(v).toUpperCase() as Rollup)
  ),
});

export const withCategoryFilterSchema = z.object({
  category: categorySchema.optional(),
});

export const withTypeFilterSchema = z.object({
  type: typeSchema.default("canonical"),
});

export const withDateRangeFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const withAddressFilterSchema = z.object({
  from: commaSeparatedValuesSchema.transform((values) =>
    values?.map((v) => addressSchema.parse(v))
  ),
  to: addressSchema.optional(),
});

export const withSortFilterSchema = z.object({
  sort: sortSchema.default("desc"),
});

export const withAllFiltersSchema = withSortFilterSchema
  .merge(withBlockRangeFilterSchema)
  .merge(withDateRangeFilterSchema)
  .merge(withSlotRangeFilterSchema)
  .merge(withRollupsFilterSchema)
  .merge(withCategoryFilterSchema)
  .merge(withAddressFilterSchema)
  .merge(withTypeFilterSchema);

export type FiltersInputSchema = z.input<typeof withAllFiltersSchema>;
export type FiltersOutputSchema = z.output<typeof withAllFiltersSchema>;

export function hasCustomFilters(filters: Filters) {
  const { sort, blockType, ...restFilters } = filters;
  return (
    Object.values(restFilters).some((value) => value !== undefined) ||
    sort !== "desc" ||
    blockType?.some !== undefined
  );
}

export const withFilters = t.middleware(({ next, input = {} }) => {
  const filters: Filters = {
    sort: "desc",
  };

  const {
    sort,
    type,
    endBlock,
    endSlot,
    rollups,
    category,
    startBlock,
    startSlot,
    startDate,
    endDate,
    from,
    to,
  } = input as FiltersOutputSchema;

  const blockRangeExists = startBlock !== undefined || endBlock !== undefined;
  const dateRangeExists = startDate !== undefined || endDate !== undefined;
  const slotRangeExists = startSlot !== undefined || endSlot !== undefined;

  const blockFilters: Filters["blockFilters"] = {};
  const transactionFilters: Filters["transactionFilters"] = {};

  if (blockRangeExists) {
    blockFilters.number = {
      lte: endBlock,
      gte: startBlock,
    };
  }

  if (dateRangeExists) {
    blockFilters.timestamp = {
      lt: endDate,
      gte: startDate,
    };
  }

  if (slotRangeExists) {
    blockFilters.slot = {
      lte: endSlot,
      gte: startSlot,
    };
  }

  if (to) {
    transactionFilters.toId = to;
  }

  if (from?.length) {
    transactionFilters.fromId = { in: from };
  }

  if (category) {
    transactionFilters.from = {
      rollup: category === "rollup" ? { not: null } : null,
    };
  }

  if (rollups?.length) {
    transactionFilters.from = { rollup: { in: rollups } };
  }

  filters.blockType = type === "reorged" ? { some: {} } : { none: {} };

  if (Object.keys(blockFilters).length) {
    filters.blockFilters = blockFilters;
  }

  if (Object.keys(transactionFilters).length) {
    filters.transactionFilters = transactionFilters;
  }

  filters.sort = sort;

  return next({
    ctx: {
      filters,
    },
  });
});
