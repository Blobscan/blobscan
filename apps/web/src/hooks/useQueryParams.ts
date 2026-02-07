import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { z } from "zod";

import {
  categorySchema,
  createMultiValueFieldSchema,
  rollupSchema,
} from "~/utils/zod-schemas";
import { SECTION_NAMES } from "~/components/Selectors/StatsSectionSelector";
import type { SectionName } from "~/components/Selectors/StatsSectionSelector";

export type Sort = "asc" | "desc";

const DEFAULT_STATS_SECTION = "all";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORT = "desc";

const allSchema = z.literal("all");

export const rollupsSchema = createMultiValueFieldSchema(
  rollupSchema.or(allSchema)
);

export const categoriesSchema = createMultiValueFieldSchema(
  categorySchema.or(allSchema)
);

export type RollupsSchema = z.output<typeof rollupsSchema>;

export type CategoriesSchema = z.output<typeof categoriesSchema>;

const statsSectionQueryParamSchema = z.object({
  section: z.enum(SECTION_NAMES).default("all"),
});

const paginationQueryParamsSchema = z.object({
  p: z.coerce.number().default(DEFAULT_PAGE),
  ps: z.coerce.number().default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["asc", "desc"]).default(DEFAULT_SORT),
});

const filterQueryParamsSchema = z
  .object({
    rollups: rollupsSchema,
    categories: categoriesSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    startBlock: z.coerce.number(),
    endBlock: z.coerce.number(),
    startSlot: z.coerce.number(),
    endSlot: z.coerce.number(),
  })
  .partial();

export type PaginationQueryParamsSchema = z.infer<
  typeof paginationQueryParamsSchema
>;
export type FilterQueryParamsSchema = z.infer<typeof filterQueryParamsSchema>;

export function serializedMultiValueParam(values: string[]) {
  return values.join(",");
}

export function useQueryParams() {
  const router = useRouter();
  const [paginationParams, setPaginationParams] =
    useState<PaginationQueryParamsSchema>({
      p: DEFAULT_PAGE,
      ps: DEFAULT_PAGE_SIZE,
      sort: DEFAULT_SORT,
    });
  const [filterParams, setFilterParams] = useState<FilterQueryParamsSchema>({});
  const [statsSection, setStatsSection] = useState<SectionName>(
    DEFAULT_STATS_SECTION
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const paginationRes = paginationQueryParamsSchema.safeParse(router.query);
    const filtersRes = filterQueryParamsSchema.safeParse(router.query);
    const statsSectionRes = statsSectionQueryParamSchema.safeParse(
      router.query
    );

    if (paginationRes.success) {
      setPaginationParams(paginationRes.data);
    }

    if (filtersRes.success) {
      setFilterParams(filtersRes.data);
    }

    if (statsSectionRes.success) {
      setStatsSection(statsSectionRes.data.section);
    }

    setIsReady(true);
  }, [router]);
  return {
    params: {
      ...paginationParams,
      ...filterParams,
    },
    paginationParams,
    filterParams,
    statsSection,
    isReady,
  };
}
