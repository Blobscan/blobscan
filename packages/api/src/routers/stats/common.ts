import { z } from "@blobscan/zod";

export const BASE_PATH = "stats";
export const BLOCK_BASE_PATH = `${BASE_PATH}/blocks`;
export const BLOB_BASE_PATH = `${BASE_PATH}/blobs`;
export const TRANSACTION_BASE_PATH = `${BASE_PATH}/transactions`;

export function buildStatsPath(path: string) {
  return `/${BASE_PATH}/${path}`;
}

export const statsSchema = z.object({
  avgBlobAsCalldataFee: z.number(),
  avgBlobFee: z.number(),
  avgBlobGasPrice: z.number(),
  avgMaxBlobGasFee: z.number(),
  totalBlobGasUsed: z.string(),
  totalBlobAsCalldataGasUsed: z.string(),
  totalBlobFee: z.string(),
  totalBlobAsCalldataFee: z.string(),
  totalBlobs: z.number(),
  totalBlobSize: z.string(),
  totalBlocks: z.number(),
  totalTransactions: z.number(),
  totalUniqueBlobs: z.number(),
  totalUniqueReceivers: z.number(),
  totalUniqueSenders: z.number(),
});
