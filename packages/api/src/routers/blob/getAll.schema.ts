import { z } from "@blobscan/zod";

export const getAllOutputSchema = z.object({
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      proof: z.string().or(z.null()),
      size: z.number(),
    })
  ),
  totalBlobs: z.number(),
});
