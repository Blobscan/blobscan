import { z } from "@blobscan/zod";

import { getBlobOverallStatsOutputSchema } from "./getBlobOverallStats.schema";
import { getBlockOverallStatsOutputSchema } from "./getBlockOverallStats.schema";
import { getTransactionOverallStatsOutputSchema } from "./getTransactionOverallStats.schema";

export const getAllOverallStatsInputSchema = z.void();
export const getAllOverallStatsOutputSchema = z.object({
  blob: getBlobOverallStatsOutputSchema,
  block: getBlockOverallStatsOutputSchema,
  transaction: getTransactionOverallStatsOutputSchema,
});
