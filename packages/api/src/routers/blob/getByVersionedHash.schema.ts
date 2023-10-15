import { z } from "@blobscan/zod";

export const getByVersionedHashInputSchema = z.object({
  versionedHash: z.string(),
});
