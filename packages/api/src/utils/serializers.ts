import {
  $Enums,
  Prisma,
  BlobDataStorageReference as DBBlobDataStorageReference,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import { DerivedTxBlobGasFields } from "./blob";
import {
  ZodBlobStorageEnum,
  ZodRollupEnum,
  blobStorageSchema,
} from "./schemas";

export function serializeDecimal(decimal: Prisma.Decimal): string {
  return decimal.toFixed();
}

export function serializeDate(date: Date): string {
  return date.toISOString();
}

export function serializeRollup(
  rollup?: $Enums.Rollup | null
): ZodRollupEnum | null {
  return rollup ? (rollup.toLowerCase() as ZodRollupEnum) : null;
}

export function serializeBlobStorage(
  blobStorage: $Enums.BlobStorage
): ZodBlobStorageEnum {
  return blobStorage.toLowerCase() as ZodBlobStorageEnum;
}

export const serializedBlobDataStorageReferenceSchema = z.object({
  blobStorage: blobStorageSchema,
  dataReference: z.string(),
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
    blobStorage: serializeBlobStorage(blobStorage),
    dataReference,
  };
}
