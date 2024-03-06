import { z } from "@blobscan/zod";

import { TransactionSchema } from "./common";

export const getByHashInputSchema = z.object({
  hash: z.string(),
});

export const getByHashOutputSchema = TransactionSchema;
