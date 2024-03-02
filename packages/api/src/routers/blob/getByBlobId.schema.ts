import { $Enums } from "@blobscan/db";
import { z } from "@blobscan/zod";

export const getByBlobIdInputSchema = z.object({
  id: z.string(),
});

export const getByBlobIdOutputSchema = z.object({
  versionedHash: z.string(),
  commitment: z.string(),
  size: z.number(),
  dataStorageReferences: z.array(
    z.object({
      blobStorage: z.enum([
        $Enums.BlobStorage.GOOGLE,
        $Enums.BlobStorage.POSTGRES,
        $Enums.BlobStorage.SWARM,
      ]),
      dataReference: z.string(),
    })
  ),
  data: z.string(),
});
