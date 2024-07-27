import type { $Enums, Prisma } from "@blobscan/db";
import type { BlobDataStorageReference as DBBlobDataStorageReference } from "@blobscan/db";
import { env } from "@blobscan/env";
import { z } from "@blobscan/zod";

import { blobStorageSchema } from "./schemas";
import type { ZodBlobStorageEnum, ZodCategoryEnum } from "./schemas";

export function serializeDecimal(decimal: Prisma.Decimal): string {
  return decimal.toFixed();
}

export function serializeDate(date: Date): string {
  return date.toISOString();
}

export function serializeCategory(
  category?: $Enums.Category | null
): ZodCategoryEnum | null {
  return category ? (category.toLowerCase() as ZodCategoryEnum) : null;
}

export function serializeBlobStorage(
  blobStorage: $Enums.BlobStorage
): ZodBlobStorageEnum {
  return blobStorage.toLowerCase() as ZodBlobStorageEnum;
}

export function buildBlobDataUrl(
  blobStorage: $Enums.BlobStorage,
  blobDataUri: string
) {
  switch (blobStorage) {
    case "GOOGLE": {
      return `https://storage.googleapis.com/${env.GOOGLE_STORAGE_BUCKET_NAME}/${blobDataUri}`;
    }
    case "SWARM": {
      return `https://gateway.ethswarm.org/access/${blobDataUri}`;
    }
    case "FILE_SYSTEM":
    case "POSTGRES": {
      return `${env.BLOBSCAN_API_BASE_URL}/blobs/${blobDataUri}/data`;
    }
  }
}

export const serializedBlobDataStorageReferenceSchema = z.object({
  storage: blobStorageSchema,
  url: z.string(),
});

export type SerializedBlobDataStorageReference = z.infer<
  typeof serializedBlobDataStorageReferenceSchema
>;

export function serializeBlobDataStorageReference(
  dataStorageReference: Pick<
    DBBlobDataStorageReference,
    "blobStorage" | "dataReference"
  >
): SerializedBlobDataStorageReference {
  const { blobStorage, dataReference } = dataStorageReference;

  return {
    storage: serializeBlobStorage(blobStorage),
    url: buildBlobDataUrl(blobStorage, dataReference),
  };
}

export function serializeBlobDataStorageReferences(
  dataStorageReferences: Parameters<
    typeof serializeBlobDataStorageReference
  >[0][]
): SerializedBlobDataStorageReference[] {
  return dataStorageReferences
    .map(serializeBlobDataStorageReference)
    .sort((a, b) => a.storage.localeCompare(b.storage));
}
