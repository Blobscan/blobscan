import type { Prisma } from "@blobscan/db";
import type { optimismDecodedFieldsSchema } from "@blobscan/db/prisma/zod-utils";
import { env } from "@blobscan/env";
import type { z } from "@blobscan/zod";

import type { BlobStorage } from "../../enums";
import { Category } from "../../enums";
import type { PrismaBlob, PrismaTransaction } from "../zod-schemas";
import { hasProperties } from "./identifiers";

export function buildBlobDataUrl(
  blobStorage: BlobStorage,
  blobDataUri: string
) {
  switch (blobStorage) {
    case "GOOGLE": {
      // TEMPORARY: Use fallback logic until all blob data storage references are updated to full access URLs
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      return process.env.MODE === "test"
        ? `${env.GOOGLE_STORAGE_API_ENDPOINT}/storage/v1/b/${
            env.GOOGLE_STORAGE_BUCKET_NAME
          }/o/${encodeURIComponent(blobDataUri)}?alt=media`
        : `https://storage.googleapis.com/${env.GOOGLE_STORAGE_BUCKET_NAME}/${blobDataUri}`;
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
    case "S3": {
      return `${env.S3_STORAGE_ENDPOINT}/${env.S3_STORAGE_BUCKET_NAME}/${blobDataUri}`;
    }
  }
}

export function deriveTransactionFields({
  blobGasPrice,
  blobGasUsed,
  blobAsCalldataGasUsed,
  maxFeePerBlobGas,
  gasPrice,
  from,
}: Pick<
  PrismaTransaction,
  | "gasPrice"
  | "blobGasUsed"
  | "blobAsCalldataGasUsed"
  | "maxFeePerBlobGas"
  | "from"
> & { blobGasPrice: Prisma.Decimal }) {
  return {
    category: from.rollup ? Category.ROLLUP : Category.OTHER,
    rollup: from.rollup,
    blobGasBaseFee: blobGasPrice.mul(blobGasUsed),
    blobAsCalldataGasFee: gasPrice.mul(blobAsCalldataGasUsed),
    blobGasMaxFee: maxFeePerBlobGas.mul(blobGasUsed),
    blobGasPrice,
  };
}

export function normalizePrismaTransactionFields({
  fromId,
  toId,
  decodedFields,
}: Pick<PrismaTransaction, "fromId" | "toId" | "decodedFields">) {
  return {
    from: fromId,
    to: toId,
    decodedFields:
      decodedFields && hasProperties(decodedFields)
        ? (decodedFields as z.output<typeof optimismDecodedFieldsSchema>)
        : null,
  };
}

export function normalizeDataStorageReferences(
  dataStorageReferences: PrismaBlob["dataStorageReferences"]
) {
  return dataStorageReferences.map(({ blobStorage, dataReference }) => ({
    storage: blobStorage,
    url: buildBlobDataUrl(blobStorage, dataReference),
  }));
}

export function normalizePrismaBlobFields({
  dataStorageReferences,
  ...restBlob
}: PrismaBlob) {
  return {
    ...restBlob,
    dataStorageReferences: normalizeDataStorageReferences(
      dataStorageReferences
    ),
  };
}
