import type { EthUsdPrice, Prisma } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db/prisma/enums";
import { Category } from "@blobscan/db/prisma/enums";
import type { optimismDecodedFieldsSchema } from "@blobscan/db/prisma/zod-utils";
import { env } from "@blobscan/env";
import type { z } from "@blobscan/zod";

import type {
  BlockDerivedFields,
  PrismaBlob,
  PrismaTransaction,
} from "../zod-schemas";
import { hasProperties } from "./identifiers";
import { ONE_ETH_IN_WEI } from "./web3";

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
      return `https://api.gateway.ethswarm.org/bzz/${blobDataUri}`;
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

export function deriveBlockFields({
  ethUsdPrice,
  blobGasUsed,
  blobGasPrice,
}: {
  ethUsdPrice?: EthUsdPrice;
  blobGasUsed: Prisma.Decimal;
  blobGasPrice: Prisma.Decimal;
}): BlockDerivedFields {
  const price = ethUsdPrice?.price;
  const weiUsdPrice = price?.mul(ONE_ETH_IN_WEI);
  const blobBaseFees = blobGasUsed.mul(blobGasPrice);
  const blobGasUsdPrice = weiUsdPrice?.mul(blobGasPrice);
  const blobBaseUsdFees = blobGasUsdPrice?.mul(blobBaseFees);

  return {
    blobBaseFees: blobBaseFees,
    blobBaseUsdFees: blobBaseUsdFees?.toFixed(),
    blobGasUsdPrice: blobGasUsdPrice?.toFixed(),
  };
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
