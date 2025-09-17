import type {
  BlobscanPrismaClient,
  EthUsdPrice,
  ExtendedTransactionSelect,
  Prisma,
} from "@blobscan/db";
import { EthUsdPriceModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedBlock,
  Expands,
} from "../../middlewares/withExpands";
import type { Prettify } from "../../types";
import {
  normalizePrismaBlobDataStorageReferencesFields,
  normalizePrismaTransactionFields,
} from "../../utils";
import {
  baseTransactionSchema,
  baseBlobSchema,
  baseBlockSchema,
} from "../../zod-schemas";
import type { ExtendedBlobDataStorageReference } from "../blob/helpers";
import { extendedBlobDataStorageReferenceArgs } from "../blob/helpers";

const transactionSelect = {
  hash: true,
  fromId: true,
  toId: true,
  blobGasMaxFee: true,
  blobGasUsed: true,
  blobAsCalldataGasFee: true,
  blobAsCalldataGasUsed: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  index: true,
  decodedFields: true,
  from: {
    select: {
      address: true,
      rollup: true,
      category: true,
    },
  },
  computeBlobGasBaseFee: true,
  computeUsdFields: true,
} satisfies ExtendedTransactionSelect;

export type ExtendedPrismaTransaction = NonNullable<
  Prisma.Result<
    BlobscanPrismaClient["transaction"],
    { select: typeof transactionSelect },
    "findFirst"
  >
>;

export type CompletedPrismaTransaction = Prettify<
  ExtendedPrismaTransaction & {
    decodedFields: NonNullable<ExtendedPrismaTransaction["decodedFields"]>;
    block: Prettify<
      Partial<ExpandedBlock> & {
        blobGasPrice: ExpandedBlock["blobGasPrice"];
      }
    >;
    blobs: Prettify<
      { blobHash: string } & {
        blob: {
          dataStorageReferences: ExtendedBlobDataStorageReference[];
        } & Partial<ExpandedBlob>;
      }
    >[];
  }
>;

export function createTransactionSelect(expands: Expands) {
  const blockExpand = expands.block?.select;
  const blobExpand = expands.blob?.select;

  return {
    ...transactionSelect,
    block: {
      select: {
        ...(blockExpand ?? {}),
        blobGasPrice: true,
      },
    },
    blobs: {
      select: {
        blobHash: true,
        blob: {
          select: {
            dataStorageReferences: extendedBlobDataStorageReferenceArgs,
            ...(blobExpand ?? {}),
          },
        },
      },
      orderBy: {
        index: "asc",
      },
    },
  } satisfies Prisma.TransactionSelect;
}

export const responseTransactionSchema = baseTransactionSchema.extend({
  block: baseBlockSchema
    .omit({
      hash: true,
      number: true,
      timestamp: true,
    })
    .partial()
    .required({
      blobGasPrice: true,
    }),
  blobs: z.array(baseBlobSchema.partial().required({ versionedHash: true })),
  ethUsdPrice: EthUsdPriceModel.shape.price.optional(),
});

export type ResponseTransaction = z.input<typeof responseTransactionSchema>;

export function toResponseTransaction(
  prismaTx: CompletedPrismaTransaction,
  ethUsdPrice?: EthUsdPrice["price"]
): ResponseTransaction {
  const {
    blobs: blobsOnTxs,
    block,
    from,
    fromId,
    toId,
    decodedFields,
    computeBlobGasBaseFee,
    computeUsdFields,
    ...restTx
  } = prismaTx;
  const normalizedTxFields = normalizePrismaTransactionFields({
    from,
    decodedFields,
    fromId,
    toId,
  });
  const blockUsdFields =
    block.computeUsdFields && ethUsdPrice
      ? block.computeUsdFields(ethUsdPrice)
      : undefined;
  const blobGasBaseFee = computeBlobGasBaseFee(block.blobGasPrice);
  const txFeeUsdFields = ethUsdPrice
    ? computeUsdFields({
        ethUsdPrice,
        blobGasPrice: block.blobGasPrice,
      })
    : undefined;
  const blobs = blobsOnTxs.map(
    ({ blobHash, blob: { dataStorageReferences, ...restBlob } }) => ({
      dataStorageReferences: normalizePrismaBlobDataStorageReferencesFields(
        dataStorageReferences
      ),
      versionedHash: blobHash,

      ...restBlob,
    })
  );

  return {
    ...restTx,
    ...normalizedTxFields,
    ...(txFeeUsdFields ?? {}),
    blobGasBaseFee,
    blobGasPrice: block.blobGasPrice,
    block: {
      ...prismaTx.block,
      ...(blockUsdFields ?? {}),
    },
    blobs,
    ethUsdPrice: ethUsdPrice?.toNumber(),
  };
}
