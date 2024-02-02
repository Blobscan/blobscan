import { z } from "@blobscan/zod";

export const byTermInputSchema = z.object({
  term: z.string(),
});
