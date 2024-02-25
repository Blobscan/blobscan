import { $Enums } from "@blobscan/db";
import { z } from "@blobscan/zod";

export const getByVersionedHashInputSchema = z.object({
  versioned_hash: z.string(),
});

export const getByVersionedHashOutputSchema = z.object({
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
