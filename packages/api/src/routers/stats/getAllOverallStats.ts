import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";
import {
  outputSchema as getBlobOverallStatsOutputSchema,
  getBlobOverallStatsQuery,
} from "./getBlobOverallStats";
import {
  outputSchema as getBlockOverallStatsOutputSchema,
  getBlockOverallStatsQuery,
} from "./getBlockOverallStats";
import {
  outputSchema as getTransactionOverallStatsOutputSchema,
  getTransactionOverallStatsQuery,
} from "./getTransactionOverallStats";

const inputSchema = z.void();

const outputSchema = z.object({
  blob: getBlobOverallStatsOutputSchema,
  block: getBlockOverallStatsOutputSchema,
  transaction: getTransactionOverallStatsOutputSchema,
});

export const getAllOverallStats = publicProcedure
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
