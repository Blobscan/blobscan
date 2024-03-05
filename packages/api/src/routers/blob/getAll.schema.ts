import { z } from "@blobscan/zod";

export const getAllOutputSchema = z.object({
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      size: z.number(),
    })
  ),
  totalBlobs: z.number(),
});
