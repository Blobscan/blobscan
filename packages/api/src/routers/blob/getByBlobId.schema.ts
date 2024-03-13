import { z } from "@blobscan/zod";

export const getByBlobIdInputSchema = z.object({
  id: z.string(),
});

export const getByBlobIdOutputSchema = z.object({
  versionedHash: z.string(),
  commitment: z.string(),
  proof: z.string().or(z.null()),
  size: z.number(),
  data: z.string(),
});
