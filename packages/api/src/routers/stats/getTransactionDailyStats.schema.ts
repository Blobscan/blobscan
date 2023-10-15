import { z } from "@blobscan/zod";

export const getTransactionDailyStatsOutputSchema = z.object({
  days: z.array(z.string()),
  totalTransactions: z.array(z.number()),
  totalUniqueSenders: z.array(z.number()),
  totalUniqueReceivers: z.array(z.number()),
  avgMaxBlobGasFees: z.array(z.number()),
});

export type GetTransactionDailyStatsOutputSchema = z.infer<
  typeof getTransactionDailyStatsOutputSchema
>;
