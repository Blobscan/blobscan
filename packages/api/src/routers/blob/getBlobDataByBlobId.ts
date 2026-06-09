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

// Walks an error's `cause` chain (which may branch into an array when the
// BlobStorageManager aggregates per-storage failures) to recover the
// originating IpfsGatewayError, if any.
function findIpfsGatewayError(err: unknown): IpfsGatewayError | undefined {
  if (err instanceof IpfsGatewayError) {
    return err;
  }

  const cause = (err as { cause?: unknown } | undefined)?.cause;

  if (Array.isArray(cause)) {
    for (const c of cause) {
      const found = findIpfsGatewayError(c);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  return cause ? findIpfsGatewayError(cause) : undefined;
}

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
    .query(async ({ ctx: { prisma, blobStorageManager }, input: { id } }) => {
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
            if (!blobStorageManager?.hasStorage("IPFS")) {
              continue;
            }

            // IPFS rows have no computed `url` (the CID is kept server-side):
            // resolve by the stored content-addressed dataReference (dataCid)
            // through the manager, which fetches and verifies in one request.
            const { data } = await blobStorageManager.getBlobByReferences({
              reference: dataReference,
              storage: "IPFS",
            });
            blobData = data;
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
          // The manager wraps the underlying failure in a
          // BlobStorageManagerError, so dig the gateway error out of the
          // error chain to keep surfacing its HTTP status / retryability
          // inline instead of burying them inside `cause`.
          const gatewayError = findIpfsGatewayError(err);
          const suffix = gatewayError
            ? ` (status=${gatewayError.status}, retryable=${gatewayError.retryable})`
            : "";
          const wrapped = new Error(
            `Failed to fetch blob data with reference '${dataReference}' from storage ${blobStorage}${suffix}`,
            { cause: asError }
          );
          if (gatewayError) {
            logger.warn(
              `IPFS gateway request failed for dataCid=${dataReference}: status=${gatewayError.status} retryable=${gatewayError.retryable} message="${gatewayError.message}"`
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
