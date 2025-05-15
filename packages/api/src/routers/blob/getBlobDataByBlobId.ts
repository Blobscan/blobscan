import { TRPCError } from "@trpc/server";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import {
  blobIdSchema,
  blobVersionedHashSchema,
  buildVersionedHash,
  hexSchema,
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
      summary: "Retrieves blob data for given blob id.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, blobStorageManager }, input: { id } }) => {
    let versionedHash: string;

    if (blobVersionedHashSchema.safeParse(id).success) {
      versionedHash = id;
    } else {
      versionedHash = buildVersionedHash(id);
    }

    let blobData: string | undefined;

    try {
      const { data } = await blobStorageManager.getBlobByHash(versionedHash);

      blobData = data;
    } catch (_) {
      const references = await prisma.blobDataStorageReference
        .findMany({
          where: {
            blobHash: versionedHash,
          },
        })
        .then((refs) =>
          refs.map<BlobReference>((r) => ({
            reference: r.dataReference,
            storage: r.blobStorage,
          }))
        );

      if (references.length) {
        const { data } = await blobStorageManager.getBlobByReferences(
          ...references
        );

        blobData = data;
      }
    }

    if (!blobData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob data found for blob with id '${id}'.`,
      });
    }

    return blobData;
  });
