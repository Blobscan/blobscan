import type { $Enums, Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import { blockNumberSchema, rollupSchema, slotSchema } from "../utils";
import type { TypeOrEmpty } from "../utils";

export type Filters = {
  rollupFilter?: $Enums.Rollup;
  typeFilter: TypeOrEmpty<{
    transactionForks: Prisma.TransactionForkListRelationFilter;
  }>;
  sort: Prisma.SortOrder;
  blockRangeFilter: TypeOrEmpty<{
    number: Prisma.BlockWhereInput["number"];
  }>;
  slotRangeFilter: TypeOrEmpty<{
    slot: Prisma.BlockWhereInput["slot"];
  }>;
};

const sortSchema = z.enum(["asc", "desc"]);

const typeSchema = z.enum(["reorg", "finalized", "normal"]);

export const blockRangeFilterSchema = z.object({
  startBlock: blockNumberSchema.optional(),
  endBlock: blockNumberSchema.optional(),
});

export const slotRangeFilterSchema = z.object({
  startSlot: slotSchema.optional(),
  endSlot: slotSchema.optional(),
});

export const rollupFilterSchema = z.object({
  rollup: rollupSchema.optional(),
});

export const typeFilterSchema = z.object({
  type: typeSchema.default("normal"),
});

export const sortFilterSchema = z.object({
  sort: sortSchema.default("desc"),
});

export const allFiltersSchema = sortFilterSchema
  .merge(blockRangeFilterSchema)
  .merge(slotRangeFilterSchema)
  .merge(rollupFilterSchema)
  .merge(typeFilterSchema);

export type FiltersSchema = z.infer<typeof allFiltersSchema>;

export const withFilters = t.middleware(({ next, input = {} }) => {
  const filters: Filters = {
    blockRangeFilter: {},
    rollupFilter: undefined,
    slotRangeFilter: {},
    sort: "desc",
    typeFilter: {},
  };

  const filtersResult = allFiltersSchema.safeParse(input);

  if (filtersResult.success) {
    const { sort, type, endBlock, endSlot, rollup, startBlock, startSlot } =
      filtersResult.data;

    const blockRangeExists = startBlock !== undefined || endBlock !== undefined;
    const slotRangeExists = startSlot !== undefined || endSlot !== undefined;

    if (blockRangeExists) {
      filters.blockRangeFilter = {
        number: {
          lt: endBlock,
          gte: startBlock,
        },
      };
    }

    if (slotRangeExists) {
      filters.slotRangeFilter = {
        slot: {
          lt: endSlot,
          gte: startSlot,
        },
      };
    }

    filters.rollupFilter = rollup?.toUpperCase() as $Enums.Rollup | undefined;
    filters.sort = sort;
    filters.typeFilter = {
      transactionForks: type === "reorg" ? { some: {} } : { none: {} },
    };
  }

  return next({
    ctx: {
      filters,
    },
  });
});
