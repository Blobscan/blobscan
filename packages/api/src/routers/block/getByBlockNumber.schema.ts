import { z } from "@blobscan/zod";

export const getByBlockNumberInputSchema = z.object({
  number: z.number(),
  reorg: z.boolean().optional(),
});
