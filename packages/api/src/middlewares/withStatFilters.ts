import dayjs from "@blobscan/dayjs";
import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Category, Rollup } from "../../enums";
import { t } from "../trpc-client";
import {
  commaSeparatedCategoriesSchema,
  commaSeparatedRollupsSchema,
} from "../zod-schemas";

export const timeFrameSchema = z.enum([
  "1d",
  "7d",
  "15d",
  "30d",
  "90d",
  "180d",
  "360d",
  "All",
]);

export type TimeFrame = z.infer<typeof timeFrameSchema>;

export type DayStatFilter = {
  day: string | Date | Prisma.DateTimeFilter<"DailyStats">;
};

export type CategoryStatFilter = {
  category?: null | { not: null } | { in: Category[] };
};
export type RollupStatFilter = {
  rollup?: null | { not: null } | { in: Rollup[] };
};

export type StatsFilters = Partial<
  DayStatFilter &
    CategoryStatFilter &
    RollupStatFilter & { OR: (CategoryStatFilter & RollupStatFilter)[] }
>;

const allSchema = z.literal("all");

export const withTimeFrameFilterSchema = z.object({
  timeFrame: timeFrameSchema.optional(),
});

export const withStatCategoriesFilterSchema = z.object({
  categories: allSchema.or(commaSeparatedCategoriesSchema).optional(),
});

export const withStatRollupsFilterSchema = z.object({
  rollups: allSchema.or(commaSeparatedRollupsSchema).optional(),
});

export const withAllStatFiltersSchema = withTimeFrameFilterSchema.merge(
  withStatCategoriesFilterSchema.merge(withStatRollupsFilterSchema)
);

export type StatFiltersOutputSchema = z.output<typeof withAllStatFiltersSchema>;

function buildDayWhereClause(timeFrame: TimeFrame): DayStatFilter["day"] {
  const day = parseInt(timeFrame.split("d")[0] ?? "1d");
  const final = dayjs().subtract(1, "day").endOf("day");
  const finalDate = final.toDate();

  if (day === 1) {
    return {
      gte: finalDate,
      lte: finalDate,
    };
  }

  return {
    gte: final.subtract(day, "day").startOf("day").toDate(),
    lte: finalDate,
  };
}

export const withStatFilters = t.middleware(({ next, input = {} }) => {
  const { categories, rollups, timeFrame } = input as StatFiltersOutputSchema;
  const statFilters: StatsFilters = {};

  if (timeFrame) {
    statFilters.day = buildDayWhereClause(timeFrame);
  }

  const isAllCategoriesEnabled = categories === "all";
  const isAllRollupsEnabled = rollups === "all";

  if (isAllCategoriesEnabled && isAllRollupsEnabled) {
    return next({
      ctx: {
        statFilters,
      },
    });
  }

  const categoryFilter: CategoryStatFilter = {
    category: categories
      ? isAllCategoriesEnabled
        ? {
            not: null,
          }
        : {
            in: categories,
          }
      : null,
  };
  const rollupFilter: RollupStatFilter = {
    rollup: rollups
      ? isAllRollupsEnabled
        ? {
            not: null,
          }
        : {
            in: rollups,
          }
      : null,
  };

  if (categories && rollups) {
    statFilters.OR = [categoryFilter, rollupFilter];
  } else {
    statFilters.category = categoryFilter.category;
    statFilters.rollup = rollupFilter.rollup;
  }

  return next({
    ctx: {
      statFilters,
    },
  });
});
