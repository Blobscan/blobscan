import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { t } from "../trpc-client";

/**
 * A data storage reference as emitted by the response builders before signing.
 * The `dataReference` is kept around solely so this middleware can resolve a
 * signed URL for it; it is stripped from the final response by the endpoint's
 * output schema (which only exposes `{ storage, url }`).
 */
interface UnsignedDataStorageReference {
  storage: BlobStorageName;
  dataReference: string;
  url?: string;
}

function isUnsignedReference(
  value: unknown
): value is UnsignedDataStorageReference {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UnsignedDataStorageReference).storage === "string" &&
    typeof (value as UnsignedDataStorageReference).dataReference === "string"
  );
}

/**
 * Recursively walks an arbitrary response payload collecting every
 * `dataStorageReferences` entry so they can be signed in a single batch.
 */
function collectReferences(
  node: unknown,
  acc: UnsignedDataStorageReference[]
): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectReferences(item, acc);
    }

    return;
  }

  if (typeof node !== "object" || node === null) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "dataStorageReferences" && Array.isArray(value)) {
      for (const ref of value) {
        if (isUnsignedReference(ref)) {
          acc.push(ref);
        }
      }

      continue;
    }

    collectReferences(value, acc);
  }
}

/**
 * Finalizer middleware that resolves signed URLs for any blob data storage
 * reference present in the response.
 *
 * It must be chained **after** `.output(...)` so that it runs against the raw
 * resolver output (where `dataReference` is still present) and before the
 * output schema parses—and strips—those references down to `{ storage, url }`.
 *
 * Endpoints that return blobs only need to opt in with a single
 * `.use(withBlobSignedUrls)` call; the signing logic no longer needs to be
 * duplicated in each resolver.
 */
export const withBlobSignedUrls = t.middleware(
  async ({ ctx: { blobStorageManager }, next }) => {
    const result = await next();

    if (!result.ok || !blobStorageManager) {
      return result;
    }

    const references: UnsignedDataStorageReference[] = [];
    collectReferences(result.data, references);

    if (!references.length) {
      return result;
    }

    const signedUrls = await blobStorageManager.buildSignedUrls(
      references.map(({ storage, dataReference }) => ({
        storage,
        reference: dataReference,
      }))
    );

    for (const reference of references) {
      const signedUrl = signedUrls.get(reference.dataReference);

      if (signedUrl) {
        reference.url = signedUrl;
      }
    }

    return result;
  }
);
