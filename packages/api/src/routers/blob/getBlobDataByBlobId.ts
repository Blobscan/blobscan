import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import {
  blobIdSchema,
  blobVersionedHashSchema,
  buildVersionedHash,
  hexSchema,
  retrieveBlobData,
} from "../../utils";

const inputSchema = z.object({
  id: blobIdSchema,
});

const outputSchema = hexSchema;

export const getBlobDataByBlobId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}/data",
      tags: ["blobs"],
      summary: "Retrives blob data for given blob id.",
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
