import { TRPCError } from "@trpc/server";
import { sha256 } from "viem";

import { BlobStorageManagerError } from "@blobscan/blob-storage-manager";
import type {
  BlobReference,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type { Prisma } from "@blobscan/db";
import type { BlobDataStorageReference } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db/prisma/enums";
import {
  stringifyDecimalSchema,
  zodDecimalSchema,
} from "@blobscan/db/prisma/zod-utils";
import { env } from "@blobscan/env";
import { z } from "@blobscan/zod";

export type TransactionFeeFields = {
  blobAsCalldataGasFee: Prisma.Decimal;
  blobGasBaseFee: Prisma.Decimal;
  blobGasMaxFee: Prisma.Decimal;
};

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

export function calculateTxFeeFields({
  blobGasUsed,
  blobAsCalldataGasUsed,
  blobGasPrice,
  gasPrice,
  maxFeePerBlobGas,
}: {
  blobGasUsed: Prisma.Decimal;
  blobAsCalldataGasUsed: Prisma.Decimal;
  blobGasPrice: Prisma.Decimal;
  gasPrice: Prisma.Decimal;
  maxFeePerBlobGas: Prisma.Decimal;
}): TransactionFeeFields {
  const blobGasMaxFee = maxFeePerBlobGas.mul(blobGasUsed);
  const blobAsCalldataGasFee = gasPrice.mul(blobAsCalldataGasUsed);
  const blobGasBaseFee = blobGasPrice.mul(blobGasUsed);

  return {
    blobAsCalldataGasFee,
    blobGasBaseFee,
    blobGasMaxFee,
  };
}

export const transactionFeeFieldsSchema = z.object({
  blobAsCalldataGasFee: zodDecimalSchema,
  blobGasBaseFee: zodDecimalSchema,
  blobGasMaxFee: zodDecimalSchema,
});

export const serializedTransactionFeeFieldsSchema =
  transactionFeeFieldsSchema.transform(
    ({ blobAsCalldataGasFee, blobGasBaseFee, blobGasMaxFee }) => ({
      blobAsCalldataGasFee: stringifyDecimalSchema.parse(blobAsCalldataGasFee),
      blobGasBaseFee: stringifyDecimalSchema.parse(blobGasBaseFee),
      blobGasMaxFee: stringifyDecimalSchema.parse(blobGasMaxFee),
    })
  );

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
