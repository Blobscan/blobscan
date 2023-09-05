import { publicProcedure } from "../../../procedures";
import { BASE_PATH } from "../common";
import { getBlobOverallStatsQuery } from "../getBlobOverallStats";
import { getBlockOverallStatsQuery } from "../getBlockOverallStats";
import { getTransactionOverallStatsQuery } from "../getOverallStats";
import {
  getAllOverallStatsInputSchema,
  getAllOverallStatsOutputSchema,
} from "./schema";

export const getAllOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/overall`,
      tags: ["overall"],
      summary: "Get all overall stats",
    },
  })
  .input(getAllOverallStatsInputSchema)
  // TODO: Find a better way to do this by trying to convert prisma types to zod types
  .output(getAllOverallStatsOutputSchema)
  .query(({ ctx: { prisma } }) =>
    Promise.all([
      getBlobOverallStatsQuery(prisma),
      getBlockOverallStatsQuery(prisma),
      getTransactionOverallStatsQuery(prisma),
    ]).then(([blob, block, transaction]) => ({
      blob,
      block,
      transaction,
    }))
  );
