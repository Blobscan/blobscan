import { AllTimeMetricsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { dimensionSchema, getDimension } from "../../zod-schemas";
import { buildStatsPath } from "./helpers";

const metricsSchema = AllTimeMetricsModel.omit({
  id: true,
  category: true,
  rollup: true,
  updatedAt: true,
});

const outputSchema = z
  .object({
    data: z
      .object({
        dimension: dimensionSchema,
        metrics: metricsSchema,
        updatedAt: AllTimeMetricsModel.shape.updatedAt,
      })
      .array(),
  })
  .transform(normalize);

export const getOverall = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: buildStatsPath("overall"),
      tags: ["stats"],
      summary: "retrieves all overall stats.",
    },
  })
  .input(z.void())
  .output(outputSchema)
  .query(async ({ ctx: { prisma } }) => {
    const allTimeMetrics = await prisma.allTimeMetrics.findMany({
      orderBy: [{ category: "asc" }, { rollup: "asc" }],
    });

    return {
      data: allTimeMetrics.map(
        ({ category, rollup, updatedAt, ...metrics }) => ({
          dimension: getDimension(category, rollup),
          metrics,
          updatedAt,
        })
      ),
    };
  });
