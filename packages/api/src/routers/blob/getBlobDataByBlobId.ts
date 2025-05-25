import { TRPCError } from "@trpc/server";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { env } from "@blobscan/env";
import { z } from "@blobscan/zod";

import { createAuthedProcedure, publicProcedure } from "../../procedures";
import {
  blobIdSchema,
  blobVersionedHashSchema,
  buildVersionedHash,
  hexSchema,
} from "../../utils";

const procedure = env.BLOB_DATA_API_KEY?.length
  ? createAuthedProcedure("blob-data")
  : publicProcedure;

const inputSchema = z.object({
  id: blobIdSchema,
});

const outputSchema = hexSchema;

export const getBlobDataByBlobId = procedure
  .meta({
    openapi: {
      method: "GET",
      path: "/blobs/{id}/data",
      tags: ["blobs"],
      summary: "Retrieves blob data for given blob id.",
      enabled: env.BLOB_DATA_API_ENABLED,
      protect: !!env.BLOB_DATA_API_KEY?.length,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, blobStorageManager }, input: { id } }) => {
    if (!env.BLOB_DATA_API_ENABLED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "This endpoint is disabled. You must retrieve blob data from any of the storages directly.",
      });
    }

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
