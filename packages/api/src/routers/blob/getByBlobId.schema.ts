import { BlobStorage } from "@blobscan/db";
import { z } from "@blobscan/zod";

export const getByBlobIdInputSchema = z.object({
  id: z.string(),
});

export const getByBlobIdOutputSchema = z.object({
  versionedHash: z.string(),
  commitment: z.string(),
  proof: z.string().or(z.null()),
  size: z.number(),
  dataStorageReferences: z.array(
    z.object({
      blobStorage: z.enum([
        BlobStorage.GOOGLE,
        BlobStorage.POSTGRES,
        BlobStorage.SWARM,
      ]),
      dataReference: z.string(),
    })
  ),
  data: z.string(),
});
