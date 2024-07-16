import type { $Enums, Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  addressSchema,
  blockNumberSchema,
  nullableRollupSchema,
  slotSchema,
} from "../utils";

type NumberRange = {
  gte?: number;
  lt?: number;
};

type DateRange = {
  gte?: Date;
  lt?: Date;
};

export type Filters = Partial<{
  blockNumber: NumberRange;
  blockTimestamp: DateRange;
  blockSlot: NumberRange;
  blockType: Prisma.TransactionForkListRelationFilter;
  transactionAddresses: Prisma.TransactionWhereInput["OR"];
  transactionRollup: Prisma.TransactionWhereInput["rollup"];

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

export const withTypeFilterSchema = z.object({
  type: typeSchema.default("canonical"),
});

export const withDateRangeFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const withAddressFilterSchema = z.object({
  from: addressSchema.optional(),
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
  .merge(withAddressFilterSchema)
  .merge(withTypeFilterSchema);

export type FiltersSchema = z.infer<typeof withAllFiltersSchema>;

export const withFilters = t.middleware(({ next, input = {} }) => {
  const filters: Filters = {
    sort: "desc",
  };

  const filtersResult = withAllFiltersSchema.safeParse(input);

  if (filtersResult.success) {
    const {
      sort,
      type,
      endBlock,
      endSlot,
      rollup,
      startBlock,
      startSlot,
      startDate,
      endDate,
      from,
      to,
    } = filtersResult.data;

    const blockRangeExists = startBlock !== undefined || endBlock !== undefined;
    const dateRangeExists = startDate !== undefined || endDate !== undefined;
    const slotRangeExists = startSlot !== undefined || endSlot !== undefined;
    const addressExists = from !== undefined || to !== undefined;

    if (blockRangeExists) {
      filters.blockNumber = {
        lt: endBlock,
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
        lt: endSlot,
        gte: startSlot,
      };
    }

    if (addressExists) {
      filters.transactionAddresses = [];
      if (from) {
        filters.transactionAddresses.push({
          fromId: from,
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
      rollup === "null"
        ? null
        : (rollup?.toUpperCase() as $Enums.Rollup | undefined);
    filters.sort = sort;
  }

  return next({
    ctx: {
      filters,
    },
  });
});
