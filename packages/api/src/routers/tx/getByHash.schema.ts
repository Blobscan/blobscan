import { z } from "@blobscan/zod";

export const getByHashInputSchema = z.object({
  hash: z.string(),
});
