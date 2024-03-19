import { z } from "@blobscan/zod";

import { serializedTransactionSchema } from "./common";

export const getByHashInputSchema = z.object({
  hash: z.string(),
});

export const getByHashOutputSchema = serializedTransactionSchema;
