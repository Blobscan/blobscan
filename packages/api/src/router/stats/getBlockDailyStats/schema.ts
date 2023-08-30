import { z } from "@blobscan/zod";

export const getBlockDailyStatsOutputSchema = z.object({
  days: z.array(z.string()),
  totalBlocks: z.array(z.number()),
  totalBlobGasUsed: z.array(z.number()),
  totalBlobAsCalldataGasUsed: z.array(z.number()),
  totalBlobFees: z.array(z.number()),
  totalBlobAsCalldataFees: z.array(z.number()),
  avgBlobFees: z.array(z.number()),
  avgBlobAsCalldataFees: z.array(z.number()),
  avgBlobGasPrices: z.array(z.number()),
});

export type GetBlockDailyStatsOutputSchema = z.infer<
  typeof getBlockDailyStatsOutputSchema
>;
