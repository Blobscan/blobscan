import {
  blobVersionedHashSchema,
  hexSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { buildVersionedHash, normalize, retrieveBlobData } from "../../utils";
import { blobIdSchema } from "../../zod-schemas";

const inputSchema = z.object({
  id: blobIdSchema,
});

const outputSchema = hexSchema.transform(normalize);

export const getBlobDataByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}/data",
      tags: ["blobs"],
      summary: "Retrieves blob data for given blob id.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { blobStorageManager }, input: { id } }) => {
    let versionedHash: string;

    if (blobVersionedHashSchema.safeParse(id).success) {
      versionedHash = id;
    } else {
      versionedHash = buildVersionedHash(id);
    }

    const blobData = await retrieveBlobData(blobStorageManager, {
      versionedHash,
    });

    return blobData;
  });
