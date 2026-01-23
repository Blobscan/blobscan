import { OverallStatsModel } from "@blobscan/db/prisma/zod";

import {
  withStatCategoriesFilterSchema,
  withStatFilters,
  withStatRollupsFilterSchema,
} from "../../middlewares/withStatFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { buildStatsPath } from "./helpers";

const inputSchema = withStatCategoriesFilterSchema
  .merge(withStatRollupsFilterSchema)
  .optional();

const outputSchema = OverallStatsModel.omit({
  id: true,
})
  .required({ category: true, rollup: true })
  .array()
  .transform(normalize);

export const getOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: buildStatsPath("overall"),
      tags: ["stats"],
      summary: "retrieves all overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .use(withStatFilters)
  .query(async ({ ctx: { prisma, statFilters } }) => {
    const allOverallStats = await prisma.overallStats.findMany({
      select: statFilters.select,
      where: statFilters.where,
      orderBy: [{ category: "asc" }, { rollup: "asc" }],
    });

    return allOverallStats;
  });
