import type {
  Prisma,
  BlobDataStorageReference as DBBlobDataStorageReference,
} from "@blobscan/db/prisma/client";
import type { BlobStorage, Category, Rollup } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";
import { z } from "@blobscan/zod";

import { blobStorageSchema } from "./schemas";
import type {
  ZodBlobStorageEnum,
  ZodCategoryEnum,
  ZodRollupEnum,
} from "./schemas";

export function serializeDecimal(decimal: Prisma.Decimal): string {
  return decimal.toFixed();
}

export function serializeDate(date: Date): string {
  return date.toISOString();
}

export function serializeRollup(rollup?: Rollup | null): ZodRollupEnum | null {
  return rollup ? (rollup.toLowerCase() as ZodRollupEnum) : null;
}

export function serializeBlobStorage(
  blobStorage: BlobStorage
): ZodBlobStorageEnum {
  return blobStorage.toLowerCase() as ZodBlobStorageEnum;
}

export function serializeCategory(category: Category): ZodCategoryEnum {
  return category.toLowerCase() as ZodCategoryEnum;
}

export function buildBlobDataUrl(
  blobStorage: BlobStorage,
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
    case "WEAVEVM": {
      return `${env.WEAVEVM_STORAGE_API_BASE_URL}/v1/blob/${blobDataUri}`;
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
