import { TRPCError } from "@trpc/server";
import { sha256 } from "viem";

import { BlobStorageManagerError } from "@blobscan/blob-storage-manager";
import type {
  BlobReference,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type { Prisma } from "@blobscan/db";
import type { BlobDataStorageReference } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { serializeDecimal } from "./serializers";

export type DerivedTxBlobGasFields = {
  blobAsCalldataGasFee: Prisma.Decimal;
  blobGasBaseFee?: Prisma.Decimal;
  blobGasMaxFee: Prisma.Decimal;
};

export function calculateDerivedTxBlobGasFields({
  blobGasUsed,
  blobAsCalldataGasUsed,
  blobGasPrice,
  gasPrice,
  maxFeePerBlobGas,
}: {
  blobGasUsed: Prisma.Decimal;
  blobAsCalldataGasUsed: Prisma.Decimal;
  blobGasPrice?: Prisma.Decimal;
  gasPrice: Prisma.Decimal;
  maxFeePerBlobGas: Prisma.Decimal;
}): DerivedTxBlobGasFields {
  const blobGasMaxFee = maxFeePerBlobGas.mul(blobGasUsed);

  const derivedBlobGasFields: DerivedTxBlobGasFields = {
    blobAsCalldataGasFee: gasPrice.mul(blobAsCalldataGasUsed),
    blobGasMaxFee,
  };

  if (blobGasPrice) {
    derivedBlobGasFields.blobGasBaseFee = blobGasPrice.mul(blobGasUsed);
  }

  return derivedBlobGasFields;
}

export const serializedDerivedTxBlobGasFieldsSchema = z.object({
  blobAsCalldataGasFee: z.string(),
  blobGasBaseFee: z.string().optional(),
  blobGasMaxFee: z.string(),
});

export type SerializedDerivedTxBlobGasFields = z.infer<
  typeof serializedDerivedTxBlobGasFieldsSchema
>;

export function serializeDerivedTxBlobGasFields({
  blobAsCalldataGasFee,
  blobGasBaseFee,
  blobGasMaxFee,
}: DerivedTxBlobGasFields): SerializedDerivedTxBlobGasFields {
  const serializedFields: SerializedDerivedTxBlobGasFields = {
    blobAsCalldataGasFee: serializeDecimal(blobAsCalldataGasFee),
    blobGasMaxFee: serializeDecimal(blobGasMaxFee),
  };

  if (blobGasBaseFee) {
    serializedFields.blobGasBaseFee = serializeDecimal(blobGasBaseFee);
  }

  return serializedFields;
}

export function buildVersionedHash(commitment: string) {
  const hashedCommitment = sha256(commitment as `0x${string}`);

  return `0x01${hashedCommitment.slice(4)}`;
}

export async function retrieveBlobData(
  blobStorageManager: BlobStorageManager,
  {
    versionedHash,
    dataStorageReferences,
  }: {
    versionedHash?: string;
    dataStorageReferences?: Pick<
      BlobDataStorageReference,
      "blobStorage" | "dataReference"
    >[];
  }
) {
  const blobReferences = dataStorageReferences?.map<BlobReference>(
    ({ blobStorage, dataReference }) => ({
      storage: blobStorage,
      reference: dataReference,
    })
  );

  if (!versionedHash && !blobReferences?.length) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "No versioned hash nor data storage references provided to retrieve blob data",
    });
  }

  const blobRetrievalOps: (() => Promise<string>)[] = [];

  if (blobReferences?.length) {
    blobRetrievalOps.push(() =>
      blobStorageManager
        .getBlobByReferences(...blobReferences)
        .then((res) => res.data)
    );
  }

  if (versionedHash) {
    blobRetrievalOps.push(() =>
      blobStorageManager.getBlobByHash(versionedHash).then(({ data }) => data)
    );
  }

  if (!blobRetrievalOps.length) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "No identifier (versioned hash or data storage refs) provided to retrieve blob data",
    });
  }

  let blobData: string | undefined;
  let retrievalOp = blobRetrievalOps.pop();
  let retrievalOpError: BlobStorageManagerError | Error | undefined;

  while (retrievalOp && !blobData) {
    try {
      blobData = await retrievalOp();
    } catch (err) {
      if (err instanceof BlobStorageManagerError) {
        retrievalOpError = err;
      } else if (err instanceof Error) {
        retrievalOpError = err;
      }
    } finally {
      retrievalOp = blobRetrievalOps.pop();
    }
  }

  if (!blobData) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: retrievalOpError?.message ?? "Failed to retrieve blob data",
      cause: retrievalOpError?.cause,
    });
  }

  return blobData;
}
