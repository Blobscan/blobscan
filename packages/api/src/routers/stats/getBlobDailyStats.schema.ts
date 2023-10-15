import { z } from "@blobscan/zod";

export const getBlobDailyStatsOutputSchema = z.object({
  days: z.array(z.string()),
  totalBlobs: z.array(z.number()),
  totalUniqueBlobs: z.array(z.number()),
  totalBlobSizes: z.array(z.number()),
  avgBlobSizes: z.array(z.number()),
});

export type GetBlobDailyStatsOutputSchema = z.infer<
  typeof getBlobDailyStatsOutputSchema
>;
