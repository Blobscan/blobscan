import { OverallStatsModel } from "@blobscan/db/prisma/zod";

import {
  withStatCategoriesFilterSchema,
  withStatFilters,
  withStatRollupsFilterSchema,
} from "../../middlewares/withStatFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { createRedisCacheMiddleware } from "../../utils/redis-cache";
import { BASE_PATH } from "./helpers";

const inputSchema = withStatCategoriesFilterSchema
  .merge(withStatRollupsFilterSchema)
  .optional();

const outputSchema = OverallStatsModel.omit({
  id: true,
})
  .required({ category: true, rollup: true })
  .array()
  .transform(normalize);

// Create a Redis cache middleware for overall stats with 1 hour TTL
const overallStatsCache = createRedisCacheMiddleware("overallStats", 60 * 60);

export const getOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves all overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .use(withStatFilters)
  .use(overallStatsCache)
  .query(async ({ ctx: { prisma, statFilters } }) => {
    const allOverallStats = await prisma.overallStats.findMany({
      select: statFilters.select,
      where: statFilters.where,
      orderBy: [{ category: "asc" }, { rollup: "asc" }],
    });

    return allOverallStats;
  });
