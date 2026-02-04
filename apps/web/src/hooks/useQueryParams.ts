import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { z } from "zod";

import { commaSeparatedRollupsSchema } from "~/utils/zod-schemas";
import { SECTION_NAMES } from "~/components/Selectors/StatsSectionSelector";
import type { SectionName } from "~/components/Selectors/StatsSectionSelector";

export type Sort = "asc" | "desc";

const DEFAULT_STATS_SECTION = "all";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORT = "desc";

const statsSectionParamSchema = z.object({
  section: z.enum(SECTION_NAMES).default("all"),
});

const paginationParamsSchema = z.object({
  p: z.coerce.number().default(DEFAULT_PAGE),
  ps: z.coerce.number().default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["asc", "desc"]).default(DEFAULT_SORT),
});

const filterParamsSchema = z
  .object({
    rollups: commaSeparatedRollupsSchema,
    category: z.enum(["rollup", "other"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    startBlock: z.coerce.number(),
    endBlock: z.coerce.number(),
    startSlot: z.coerce.number(),
    endSlot: z.coerce.number(),
  })
  .partial();

export type PaginationParamsSchema = z.infer<typeof paginationParamsSchema>;
export type FilterParamsSchema = z.infer<typeof filterParamsSchema>;

export const MULTIPLE_VALUES_SEPARATOR = ",";

export function useQueryParams() {
  const router = useRouter();
  const [paginationParams, setPaginationParams] =
    useState<PaginationParamsSchema>({
      p: DEFAULT_PAGE,
      ps: DEFAULT_PAGE_SIZE,
      sort: DEFAULT_SORT,
    });
  const [filterParams, setFilterParams] = useState<FilterParamsSchema>({});
  const [statsSection, setStatsSection] = useState<SectionName>(
    DEFAULT_STATS_SECTION
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const paginationRes = paginationParamsSchema.safeParse(router.query);
    const filtersRes = filterParamsSchema.safeParse(router.query);
    const statsSectionRes = statsSectionParamSchema.safeParse(router.query);

    if (paginationRes.success) {
      setPaginationParams(paginationRes.data);
    } else {
      console.warn("Invalid pagination params ", paginationRes.error);
    }

    if (filtersRes.success) {
      setFilterParams(filtersRes.data);
    } else {
      console.warn("Invalid filters params ", filtersRes.error);
    }

    if (statsSectionRes.success) {
      setStatsSection(statsSectionRes.data.section);
    } else {
      console.warn("Invalid stats section ", statsSectionRes.error);
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
