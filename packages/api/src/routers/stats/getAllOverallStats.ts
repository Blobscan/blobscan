import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";
import {
  getAllOverallStatsInputSchema,
  getAllOverallStatsOutputSchema,
} from "./getAllOverallStats.schema";
import { getBlobOverallStatsQuery } from "./getBlobOverallStats";
import { getBlockOverallStatsQuery } from "./getBlockOverallStats";
import { getTransactionOverallStatsQuery } from "./getTransactionOverallStats";

export const getAllOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "get all overall stats",
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
