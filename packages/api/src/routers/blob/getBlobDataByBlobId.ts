import { TRPCError } from "@trpc/server";

import {
  blobVersionedHashSchema,
  hexSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { createAuthedProcedure, publicProcedure } from "../../procedures";
import type { ProcedureConfig } from "../../types";
import { bytesToHex, computeVersionedHash, normalize } from "../../utils";
import { blobIdSchema } from "../../zod-schemas";

const inputSchema = z.object({
  id: blobIdSchema,
});

const outputSchema = hexSchema.transform(normalize);

export function createBlobDataByBlobIdProcedure(config?: ProcedureConfig) {
  const isEnabled = !!config?.enabled;
  const isProtected = !!config?.enabled;

  const procedure = isProtected
    ? createAuthedProcedure("blob-data")
    : publicProcedure;

  return procedure
    .meta({
      openapi: {
        method: "GET",
        path: "/blobs/{id}/data",
        tags: ["blobs"],
        summary: "Retrieves blob data for given blob id.",
        enabled: isEnabled,
        protect: isProtected,
      },
    })
    .input(inputSchema)
    .output(outputSchema)
    .query(async ({ ctx: { prisma }, input: { id } }) => {
      if (!isEnabled) {
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
        versionedHash = computeVersionedHash(id);
      }

      let blobData: string | undefined;

      const storageUrls = await prisma.blobDataStorageReference.findMany({
        where: {
          blobHash: versionedHash,
        },
      });

      if (!storageUrls.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob data storage URLs found for blob with id '${id}'.`,
        });
      }

      const storageErrors: Error[] = [];

      for (const { blobStorage, dataReference, url } of storageUrls) {
        try {
          if (!url) {
            continue;
          }

          const isBinaryFile =
            url.includes(".bin") || blobStorage === "POSTGRES";

          if (blobStorage === "POSTGRES") {
            const res = await prisma.blobData.findFirst({
              where: {
                id: dataReference,
              },
            });

            if (!res) {
              throw new Error(`Blob data not found `);
            }

            blobData = bytesToHex(res.data);
          } else {
            const response = await fetch(url);

            if (!response.ok) {
              const error = await response.json();

              throw new Error(error.message);
            }
            if (isBinaryFile) {
              const blobBytes = await response.arrayBuffer();

              blobData = bytesToHex(blobBytes);
            } else {
              blobData = await response.text();
            }
          }
        } catch (err) {
          if (err instanceof Error) {
            storageErrors.push(
              new Error(
                `Failed to fetch blob data with reference with URI '${dataReference}'  from storage ${blobStorage}`,
                {
                  cause: err,
                }
              )
            );
          }
        }
      }

      if (!blobData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch data for blob with id '${id}' from any of the storages`,
          cause: storageErrors,
        });
      }

      return blobData;
    });
}
