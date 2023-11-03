import { toBigIntSchema, z } from "@blobscan/zod";

export const indexDataInputSchema = z.object({
  block: z.object({
    number: z.coerce.number(),
    hash: z.string(),
    timestamp: z.coerce.number(),
    slot: z.coerce.number(),
    blobGasUsed: toBigIntSchema,
    excessBlobGas: toBigIntSchema,
  }),
  transactions: z.array(
    z.object({
      hash: z.string(),
      from: z.string(),
      to: z.string(),
      blockNumber: z.coerce.number(),
      gasPrice: toBigIntSchema,
      maxFeePerBlobGas: toBigIntSchema,
    })
  ),
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      data: z.string(),
      txHash: z.string(),
      index: z.coerce.number(),
    })
  ),
});

export const indexDataOutputSchema = z.void();

export type IndexDataInput = z.infer<typeof indexDataInputSchema>;
