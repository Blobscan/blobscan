import { z } from "@blobscan/zod";

export const getTransactionOverallStatsInputSchema = z.void();
export const getTransactionOverallStatsOutputSchema = z.object({
  totalTransactions: z.number(),
  totalUniqueReceivers: z.number(),
  totalUniqueSenders: z.number(),
  avgMaxBlobGasFee: z.number(),
  updatedAt: z.date(),
});
