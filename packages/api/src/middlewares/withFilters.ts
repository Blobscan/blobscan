import { $Enums, Prisma, Rollup } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { t } from "../trpc-client";
import {
  blockNumberSchema,
  rollupSchema,
  slotSchema,
  sortSchema,
  typeSchema,
} from "../utils";

type TypeOrEmpty<T> = T | {};

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

export const filtersSchema = z.object({
  rollup: rollupSchema.optional(),
  startBlock: blockNumberSchema.optional(),
  endBlock: blockNumberSchema.optional(),
  startSlot: slotSchema.optional(),
  endSlot: slotSchema.optional(),
  type: typeSchema.default("normal"),
  sort: sortSchema.default("desc"),
});

export type FiltersSchema = z.infer<typeof filtersSchema>;

export const withFilters = t.middleware(({ next, input = {} }) => {
  let filters: Filters = {
    blockRangeFilter: {},
    rollupFilter: undefined,
    slotRangeFilter: {},
    sort: "desc",
    typeFilter: {},
  };

  const filtersResult = filtersSchema.safeParse(input);

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
