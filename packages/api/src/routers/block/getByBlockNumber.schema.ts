import { z } from "@blobscan/zod";

export const getByBlockNumberInputSchema = z.object({
  number: z.number(),
});

export const getByBlockNumberOutputSchema = z.object({
  blobAsCalldataGasUsed: z.string(),
  blobGasUsed: z.string(),
  excessBlobGas: z.string(),
  blobGasPrice: z.string(),
  number: z.number(),
  hash: z.string(),
  slot: z.number(),
  timestamp: z.date(),
  transactions: z.array(
    z.object({
      hash: z.string(),
      fromId: z.string(),
      toId: z.string(),
      blobs: z.array(
        z.object({
          blobHash: z.string(),
          index: z.number(),
          blob: z.object({
            size: z.number(),
          }),
        })
      ),
    })
  ),
});
