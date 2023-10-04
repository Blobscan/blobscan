import { z } from "@blobscan/zod";

export const getBlobOverallStatsInputSchema = z.void();
export const getBlobOverallStatsOutputSchema = z.object({
  totalBlobs: z.number(),
  totalUniqueBlobs: z.number(),
  totalBlobSize: z.bigint(),
  avgBlobSize: z.number(),
  updatedAt: z.date(),
});
