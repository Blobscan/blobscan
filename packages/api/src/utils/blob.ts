import { TRPCError } from "@trpc/server";

import {
  BlobReference,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { BlobDataStorageReference, Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { serializeDecimal } from "./serializers";

export type DerivedTxBlobGasFields = {
  blobGasBaseFee?: Prisma.Decimal;
  blobGasMaxFee?: Prisma.Decimal;
  blobGasUsed?: Prisma.Decimal;
};

const GAS_PER_BLOB = 2 ** 17; // 131_072

export function calculateDerivedTxBlobGasFields({
  blobGasPrice,
  txBlobsLength,
  maxFeePerBlobGas,
}: Partial<{
  blobGasPrice: Prisma.Decimal;
  txBlobsLength: number;
  maxFeePerBlobGas: Prisma.Decimal;
}>): DerivedTxBlobGasFields {
  const derivedBlobGasFields: DerivedTxBlobGasFields = {};

  if (txBlobsLength) {
    derivedBlobGasFields.blobGasUsed = new Prisma.Decimal(txBlobsLength).mul(
      GAS_PER_BLOB
    );

    if (blobGasPrice) {
      derivedBlobGasFields.blobGasBaseFee = blobGasPrice.mul(
        derivedBlobGasFields.blobGasUsed
      );
    }

    if (maxFeePerBlobGas) {
      derivedBlobGasFields.blobGasMaxFee = maxFeePerBlobGas.mul(
        derivedBlobGasFields.blobGasUsed
      );
    }
  }

  return derivedBlobGasFields;
}

export const serializedDerivedTxBlobGasFieldsSchema = z.object({
  blobGasBaseFee: z.string().optional(),
  blobGasMaxFee: z.string().optional(),
  blobGasUsed: z.string().optional(),
});

export type SerializedDerivedTxBlobGasFields = z.infer<
  typeof serializedDerivedTxBlobGasFieldsSchema
>;

export function serializeDerivedTxBlobGasFields({
  blobGasBaseFee,
  blobGasMaxFee,
  blobGasUsed,
}: DerivedTxBlobGasFields): SerializedDerivedTxBlobGasFields {
  const serializedFields: SerializedDerivedTxBlobGasFields = {};

  if (blobGasBaseFee) {
    serializedFields.blobGasBaseFee = serializeDecimal(blobGasBaseFee);
  }

  if (blobGasMaxFee) {
    serializedFields.blobGasMaxFee = serializeDecimal(blobGasMaxFee);
  }

  if (blobGasUsed) {
    serializedFields.blobGasUsed = serializeDecimal(blobGasUsed);
  }

  return serializedFields;
}

export async function retrieveBlobData(
  blobStorageManager: BlobStorageManager,
  dataStorageRefs: Pick<
    BlobDataStorageReference,
    "blobStorage" | "dataReference"
  >[]
) {
  let storageBlobData: Awaited<ReturnType<typeof blobStorageManager.getBlob>>;
  const blobReferences = dataStorageRefs.map<BlobReference>(
    ({ blobStorage, dataReference }) => ({
      storage: blobStorage,
      reference: dataReference,
    })
  );

  try {
    storageBlobData = await blobStorageManager.getBlob(...blobReferences);
  } catch (err) {
    const err_ = err as Error;

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: err_.message,
      cause: err_.cause,
    });
  }

  if (!storageBlobData) {
    const storageReferences = blobReferences
      .map(({ reference, storage }) => `${storage}:${reference}`)
      .join(", ");

    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No blob data found on the following storage references: ${storageReferences}`,
    });
  }

  return storageBlobData;
}
