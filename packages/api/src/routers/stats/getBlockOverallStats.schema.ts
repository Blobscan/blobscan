import { z } from "@blobscan/zod";

export const getBlockOverallStatsInputSchema = z.void();
export const getBlockOverallStatsOutputSchema = z.object({
  totalBlocks: z.number(),
  totalBlobGasUsed: z.bigint(),
  totalBlobAsCalldataGasUsed: z.bigint(),
  totalBlobFee: z.bigint(),
  totalBlobAsCalldataFee: z.bigint(),
  avgBlobFee: z.number(),
  avgBlobAsCalldataFee: z.number(),
  avgBlobGasPrice: z.number(),
  updatedAt: z.date(),
});
