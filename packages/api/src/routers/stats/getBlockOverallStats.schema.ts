import { z } from "@blobscan/zod";

export const getBlockOverallStatsInputSchema = z.void();
export const getBlockOverallStatsOutputSchema = z.object({
  totalBlocks: z.number(),
  totalBlobGasUsed: z.string(),
  totalBlobAsCalldataGasUsed: z.string(),
  totalBlobFee: z.string(),
  totalBlobAsCalldataFee: z.string(),
  avgBlobFee: z.number(),
  avgBlobAsCalldataFee: z.number(),
  avgBlobGasPrice: z.number(),
  updatedAt: z.date(),
});
