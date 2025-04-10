import dayjs from "@blobscan/dayjs";
import type { Prisma } from "@blobscan/db";
import { DailyStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import type { Category, Rollup } from "../../enums";
import { t } from "../trpc-client";
import {
  commaSeparatedCategoriesSchema,
  commaSeparatedRollupsSchema,
  commaSeparatedValuesSchema,
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

export type StatsFilters = {
  select?: Prisma.DailyStatsSelect;
  where: Partial<
    DayStatFilter &
      CategoryStatFilter &
      RollupStatFilter & { OR: (CategoryStatFilter & RollupStatFilter)[] }
  >;
};

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

export const withStatsFilterSchema = z
  .object({
    stats: commaSeparatedValuesSchema.transform((values, ctx) =>
      values?.map((v) => {
        const res = DailyStatsModel.omit({
          id: true,
          day: true,
          category: true,
          rollup: true,
        })
          .keyof()
          .safeParse(v);

        if (!res.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            params: {
              value: v,
            },
            message: "Provided stats value is invalid",
          });

          return z.NEVER;
        }

        return res.data;
      })
    ),
  })
  .partial();

export const withAllStatFiltersSchema = withStatsFilterSchema
  .merge(withTimeFrameFilterSchema)
  .merge(withStatCategoriesFilterSchema.merge(withStatRollupsFilterSchema));

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
  const { categories, rollups, timeFrame, stats } =
    input as StatFiltersOutputSchema;
  let select: StatsFilters["select"];
  const where: StatsFilters["where"] = {};

  if (stats) {
    select = stats.reduce(
      (acc, key) => ({
        ...acc,
        [key]: true,
      }),
      { day: true, category: true, rollup: true }
    );
  }

  if (timeFrame) {
    where.day = buildDayWhereClause(timeFrame);
  }

  const isAllCategoriesEnabled = categories === "all";
  const isAllRollupsEnabled = rollups === "all";

  if (isAllCategoriesEnabled && isAllRollupsEnabled) {
    return next({
      ctx: {
        statFilters: {
          select,
          where,
        },
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
    where.OR = [categoryFilter, rollupFilter];
  } else {
    where.category = categoryFilter.category;
    where.rollup = rollupFilter.rollup;
  }

  return next({
    ctx: {
      statFilters: {
        select,
        where,
      },
    },
  });
});
