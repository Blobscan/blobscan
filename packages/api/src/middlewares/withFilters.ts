import type { Prisma } from "@blobscan/db";
import type { Category, Rollup } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";
import { getRollupByAddress } from "@blobscan/rollups";
import { commaSeparatedValuesSchema, z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  addressSchema,
  blockNumberSchema,
  categorySchema,
  nullableRollupSchema,
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

export type FromAddressFilter = {
  fromId: { in: string[] } | string;
};

export type ToAddressFilter = {
  toId: string;
};

export type Filters = Partial<{
  blockNumber: NumberRangeFilter;
  blockTimestamp: DateRangeFilter;
  blockSlot: NumberRangeFilter;
  blockType: Prisma.TransactionForkListRelationFilter;
  transactionAddresses: (FromAddressFilter | ToAddressFilter)[];
  transactionCategory: Category;
  transactionRollup: Rollup | null;

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

export const withRollupFilterSchema = z.object({
  rollup: nullableRollupSchema.optional(),
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
  .merge(withRollupFilterSchema)
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

export function extractAddressesFromFilter(
  addressesFilter: Filters["transactionAddresses"]
) {
  if (!addressesFilter) {
    return [];
  }

  const fromAddressFilter = addressesFilter.find(
    (f): f is FromAddressFilter => "fromId" in f
  );
  const toAddressFilter = addressesFilter.find(
    (f): f is ToAddressFilter => "toId" in f
  );
  const addresses: string[] = [];

  if (fromAddressFilter) {
    if (typeof fromAddressFilter.fromId === "string") {
      addresses.push(fromAddressFilter.fromId);
    } else {
      addresses.push(...fromAddressFilter.fromId.in);
    }
  }

  if (toAddressFilter) {
    addresses.push(toAddressFilter.toId);
  }

  return addresses;
}

export function extractRollupsFromFilter(
  addressesFilter: Filters["transactionAddresses"]
) {
  if (!addressesFilter) {
    return [];
  }

  const addresses = extractAddressesFromFilter(addressesFilter);
  const rollups: Rollup[] = addresses
    .map((addr) => getRollupByAddress(addr, env.CHAIN_ID))
    .filter((r): r is Rollup => !!r);

  return rollups;
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
    rollup,
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

  if (blockRangeExists) {
    filters.blockNumber = {
      lte: endBlock,
      gte: startBlock,
    };
  }

  if (dateRangeExists) {
    filters.blockTimestamp = {
      lt: endDate,
      gte: startDate,
    };
  }

  if (slotRangeExists) {
    filters.blockSlot = {
      lte: endSlot,
      gte: startSlot,
    };
  }

  if (from?.length || to) {
    filters.transactionAddresses = [];

    if (from?.length) {
      filters.transactionAddresses.push({
        fromId: from.length === 1 ? (from[0] as string) : { in: from },
      });
    }

    if (to) {
      filters.transactionAddresses.push({
        toId: to,
      });
    }
  }

  filters.blockType = type === "reorged" ? { some: {} } : { none: {} };

  filters.transactionRollup =
    rollup === "null" ? null : (rollup?.toUpperCase() as Rollup | undefined);

  if (filters.transactionRollup !== undefined) {
    filters.transactionCategory = "ROLLUP";
  }

  filters.transactionCategory = category?.toUpperCase() as Category | undefined;

  filters.sort = sort;

  return next({
    ctx: {
      filters,
    },
  });
});
