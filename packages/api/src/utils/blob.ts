import { TRPCError } from "@trpc/server";

import type {
  BlobReference,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { Prisma } from "@blobscan/db";
import type { BlobDataStorageReference } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { serializeDecimal } from "./serializers";

export type DerivedTxBlobGasFields = {
  blobAsCalldataGasFee: Prisma.Decimal;
  blobGasBaseFee?: Prisma.Decimal;
  blobGasMaxFee: Prisma.Decimal;
  blobGasUsed: Prisma.Decimal;
};

const GAS_PER_BLOB = 2 ** 17; // 131_072

export function calculateDerivedTxBlobGasFields({
  blobAsCalldataGasUsed,
  blobGasPrice,
  gasPrice,
  txBlobsLength,
  maxFeePerBlobGas,
}: {
  blobAsCalldataGasUsed: Prisma.Decimal;
  blobGasPrice?: Prisma.Decimal;
  gasPrice: Prisma.Decimal;
  txBlobsLength: number;
  maxFeePerBlobGas: Prisma.Decimal;
}): DerivedTxBlobGasFields {
  const blobGasUsed = new Prisma.Decimal(txBlobsLength).mul(GAS_PER_BLOB);
  const blobGasMaxFee = maxFeePerBlobGas.mul(blobGasUsed);

  const derivedBlobGasFields: DerivedTxBlobGasFields = {
    blobAsCalldataGasFee: gasPrice.mul(blobAsCalldataGasUsed),
    blobGasUsed,
    blobGasMaxFee,
  };

  if (blobGasPrice) {
    derivedBlobGasFields.blobGasBaseFee = blobGasPrice.mul(
      derivedBlobGasFields.blobGasUsed
    );
  }

  return derivedBlobGasFields;
}

export const serializedDerivedTxBlobGasFieldsSchema = z.object({
  blobAsCalldataGasFee: z.string(),
  blobGasBaseFee: z.string().optional(),
  blobGasMaxFee: z.string(),
  blobGasUsed: z.string(),
});

export type SerializedDerivedTxBlobGasFields = z.infer<
  typeof serializedDerivedTxBlobGasFieldsSchema
>;

export function serializeDerivedTxBlobGasFields({
  blobAsCalldataGasFee,
  blobGasBaseFee,
  blobGasMaxFee,
  blobGasUsed,
}: DerivedTxBlobGasFields): SerializedDerivedTxBlobGasFields {
  const serializedFields: SerializedDerivedTxBlobGasFields = {
    blobAsCalldataGasFee: serializeDecimal(blobAsCalldataGasFee),
    blobGasMaxFee: serializeDecimal(blobGasMaxFee),
    blobGasUsed: serializeDecimal(blobGasUsed),
  };

  if (blobGasBaseFee) {
    serializedFields.blobGasBaseFee = serializeDecimal(blobGasBaseFee);
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
  let storageBlobData: Awaited<
    ReturnType<typeof blobStorageManager.getBlobByReferences>
  >;
  const blobReferences = dataStorageRefs.map<BlobReference>(
    ({ blobStorage, dataReference }) => ({
      storage: blobStorage,
      reference: dataReference,
    })
  );

  try {
    storageBlobData = await blobStorageManager.getBlobByReferences(
      ...blobReferences
    );
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
