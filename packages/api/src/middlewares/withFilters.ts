import type { Prisma } from "@blobscan/db";
import { AddressModel, BlockModel } from "@blobscan/db/prisma/zod";
import {
  dbCategoryCoercionSchema,
  dbRollupCoercionSchema,
} from "@blobscan/db/prisma/zod-utils";
import { env } from "@blobscan/env";
import { getAddressesByRollup } from "@blobscan/rollups";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import { commaSeparatedValuesSchema } from "../zod-schemas";

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
  rollup: null | { not: null };
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
  startBlock: BlockModel.shape.number.optional(),
  endBlock: BlockModel.shape.number.optional(),
});

export const withSlotRangeFilterSchema = z.object({
  startSlot: BlockModel.shape.slot.optional(),
  endSlot: BlockModel.shape.slot.optional(),
});

export const withRollupsFilterSchema = z.object({
  rollups: commaSeparatedValuesSchema.transform((values) =>
    values?.map((v) => dbRollupCoercionSchema.parse(v))
  ),
});

export const withCategoryFilterSchema = z.object({
  category: dbCategoryCoercionSchema.optional(),
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
    values?.map((v) => AddressModel.shape.address.parse(v))
  ),
  to: AddressModel.shape.address.optional(),
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

  if (rollups?.length) {
    const resolvedAddresses = rollups
      .flatMap((r) => getAddressesByRollup(r, env.CHAIN_ID))
      .filter((r): r is string => !!r);

    transactionFilters.fromId = { in: resolvedAddresses };
  } else if (category) {
    transactionFilters.from = {
      rollup: category === "ROLLUP" ? { not: null } : null,
    };
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
