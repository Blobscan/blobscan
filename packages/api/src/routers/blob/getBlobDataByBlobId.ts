import { TRPCError } from "@trpc/server";

import { IpfsGatewayError } from "@blobscan/blob-storage-manager";
import {
  blobVersionedHashSchema,
  hexSchema,
} from "@blobscan/db/prisma/zod-utils";
import { logger } from "@blobscan/logger";
import { z } from "@blobscan/zod";

import { createAuthedProcedure, publicProcedure } from "../../procedures";
import type { ProcedureConfig } from "../../types";
import { bytesToHex, computeVersionedHash, normalize } from "../../utils";
import { blobIdSchema } from "../../zod-schemas";

const FETCH_TIMEOUT_MS = 30_000;

const inputSchema = z.object({
  id: blobIdSchema,
});

const outputSchema = hexSchema.transform(normalize);

export function createBlobDataByBlobIdProcedure(config?: ProcedureConfig) {
  const isEnabled = !!config?.enabled;
  const isProtected = !!config?.protected;

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
    .query(async ({ ctx: { prisma, ipfsStorage }, input: { id } }) => {
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

      // Try the cheaper / DB-backed storages first and only fall back to
      // IPFS (a network round-trip through a gateway) when nothing else
      // served the blob.
      const orderedStorageUrls = [...storageUrls].sort(
        (a, b) =>
          Number(a.blobStorage === "IPFS") - Number(b.blobStorage === "IPFS")
      );

      for (const { blobStorage, dataReference, url } of orderedStorageUrls) {
        try {
          if (blobStorage === "IPFS") {
            if (!ipfsStorage) {
              continue;
            }

            // IPFS rows have no computed `url` (the CID is kept server-side):
            // resolve by the stored content-addressed dataReference (dataCid),
            // which the storage fetches and verifies in a single request.
            blobData = await ipfsStorage.getBlob(dataReference);
            break;
          }

          if (!url) {
            continue;
          }

          const isBinaryFile = url.includes(".bin");

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
            break;
          } else {
            const response = await fetch(url, {
              signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });

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
            break;
          }
        } catch (err) {
          const asError =
            err instanceof Error ? err : new Error(String(err));
          // Surface gateway HTTP status / retryability inline instead of
          // burying them inside `cause`, so they show up directly in
          // operator logs and TRPCError chains.
          const suffix =
            err instanceof IpfsGatewayError
              ? ` (status=${err.status}, retryable=${err.retryable})`
              : "";
          const wrapped = new Error(
            `Failed to fetch blob data with reference '${dataReference}' from storage ${blobStorage}${suffix}`,
            { cause: asError }
          );
          if (err instanceof IpfsGatewayError) {
            logger.warn(
              `IPFS gateway request failed for dataCid=${dataReference}: status=${err.status} retryable=${err.retryable} message="${err.message}"`
            );
          }
          storageErrors.push(wrapped);
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
