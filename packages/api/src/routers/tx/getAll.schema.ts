import { z } from "@blobscan/zod";

import { serializedTransactionSchema } from "./common";

export const getAllOutputSchema = z.object({
  transactions: serializedTransactionSchema.array(),
  totalTransactions: z.number(),
});

export type GetAllOutput = z.infer<typeof getAllOutputSchema>;
