import type { $Enums, Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  addressSchema,
  blockNumberSchema,
  rollupSchema,
  slotSchema,
} from "../utils";
import type { TypeOrEmpty } from "../utils";

export type Filters = {
  blockFilters: TypeOrEmpty<
    Partial<{
      transactionForks: Prisma.TransactionForkListRelationFilter;
      number: Prisma.BlockWhereInput["number"];
      timestamp: Prisma.BlockWhereInput["timestamp"];
      slot: Prisma.BlockWhereInput["slot"];
    }>
  >;
  transactionFilters: TypeOrEmpty<
    Partial<{
      rollup: $Enums.Rollup;
      fromId: Prisma.TransactionWhereInput["fromId"];
      toId: Prisma.TransactionWhereInput["toId"];
      OR: Prisma.TransactionWhereInput[];
    }>
  >;
  sort: Prisma.SortOrder;
};

const sortSchema = z.enum(["asc", "desc"]);

const typeSchema = z.enum(["reorged", "normal"]);

export const withBlockRangeFilterSchema = z.object({
  startBlock: blockNumberSchema.optional(),
  endBlock: blockNumberSchema.optional(),
});

export const withSlotRangeFilterSchema = z.object({
  startSlot: slotSchema.optional(),
  endSlot: slotSchema.optional(),
});

export const withRollupFilterSchema = z.object({
  rollup: rollupSchema.optional(),
});

export const withTypeFilterSchema = z.object({
  type: typeSchema.default("normal"),
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
    blockFilters: {},
    transactionFilters: {},
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
      filters.blockFilters.number = {
        lt: endBlock,
        gte: startBlock,
      };
    }

    if (dateRangeExists) {
      filters.blockFilters.timestamp = {
        lt: endDate,
        gte: startDate,
      };
    }

    if (slotRangeExists) {
      filters.blockFilters.slot = {
        lt: endSlot,
        gte: startSlot,
      };
    }

    if (addressExists) {
      if (from && to) {
        filters.transactionFilters.OR = [
          {
            fromId: from,
          },
          {
            toId: to,
          },
        ];
      } else if (from) {
        filters.transactionFilters.fromId = from;
      } else if (to) {
        filters.transactionFilters.toId = to;
      }
    }

    filters.blockFilters.transactionForks =
      type === "reorged" ? { some: {} } : { none: {} };

    filters.transactionFilters.rollup = rollup?.toUpperCase() as
      | $Enums.Rollup
      | undefined;
    filters.sort = sort;
  }

  return next({
    ctx: {
      filters,
    },
  });
});
