import { z } from "@blobscan/zod";

export const getBlockDailyStatsOutputSchema = z.object({
  days: z.array(z.string()),
  totalBlocks: z.array(z.number()),
  totalBlobGasUsed: z.array(z.string()),
  totalBlobGasAsCalldataUsed: z.array(z.string()),
  totalBlobFees: z.array(z.string()),
  totalBlobAsCalldataFees: z.array(z.string()),
  avgBlobFees: z.array(z.number()),
  avgBlobAsCalldataFees: z.array(z.number()),
  avgBlobGasPrices: z.array(z.number()),
});

export type GetBlockDailyStatsOutputSchema = z.infer<
  typeof getBlockDailyStatsOutputSchema
>;
