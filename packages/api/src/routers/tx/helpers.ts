import type { EthUsdPrice, Prisma } from "@blobscan/db";
import { EthUsdPriceModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedBlock,
  Expands,
} from "../../middlewares/withExpands";
import type { Prettify } from "../../types";
import {
  deriveBlockFields,
  deriveTransactionFields,
  normalizeDataStorageReferences,
  normalizePrismaBlobFields,
  normalizePrismaTransactionFields,
} from "../../utils/transformers";
import {
  baseTransactionSchema,
  baseBlobSchema,
  baseBlockSchema,
} from "../../zod-schemas";

const transactionSelect = {
  hash: true,
  fromId: true,
  toId: true,
  blobGasUsed: true,
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
    },
  },
} satisfies Prisma.TransactionSelect;

const dataStorageReferenceSelect = {
  blobStorage: true,
  dataReference: true,
} satisfies Prisma.BlobDataStorageReferenceSelect;

type DataStorageReference = Prisma.BlobDataStorageReferenceGetPayload<{
  select: typeof dataStorageReferenceSelect;
}>;

type PrismaTransaction = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

export type CompletePrismaTransaction = Prettify<
  PrismaTransaction & {
    decodedFields: NonNullable<PrismaTransaction["decodedFields"]>;
    block: Prettify<
      Partial<ExpandedBlock> & {
        blobGasPrice: ExpandedBlock["blobGasPrice"];
      }
    >;
    blobs: Prettify<
      { blobHash: string } & {
        blob: {
          dataStorageReferences: DataStorageReference[];
        } & Partial<ExpandedBlob>;
      }
    >[];
  } & {
    ethUsdPrice?: EthUsdPrice;
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
            dataStorageReferences: {
              select: {
                blobStorage: true,
                dataReference: true,
              },
              orderBy: {
                blobStorage: "asc",
              },
            },
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
  prismaTx: CompletePrismaTransaction
): ResponseTransaction {
  const { blobs: blobsOnTxs, block } = prismaTx;
  const normalizedFields = normalizePrismaTransactionFields(prismaTx);
  const derivedBlockFields = block.blobGasUsed
    ? deriveBlockFields({
        ethUsdPrice: prismaTx.ethUsdPrice,
        blobGasPrice: block.blobGasPrice,
        blobGasUsed: block.blobGasUsed,
      })
    : undefined;
  const derivedTxFields = deriveTransactionFields({
    ...prismaTx,
    blobGasPrice: block.blobGasPrice,
  });
  const blobs = blobsOnTxs.map(
    ({ blobHash, blob: { dataStorageReferences, ...restBlob } }) =>
      Object.keys(restBlob)
        ? normalizePrismaBlobFields({
            versionedHash: blobHash,
            dataStorageReferences,
            ...(restBlob as Required<typeof restBlob>),
          })
        : {
            versionedHash: blobHash,
            dataStorageReferences: normalizeDataStorageReferences(
              dataStorageReferences
            ),
          }
  );

  return {
    ...prismaTx,
    block: {
      ...prismaTx.block,
      ...(derivedBlockFields ?? {}),
    },
    ...normalizedFields,
    ...derivedTxFields,
    blobs,
    ethUsdPrice: prismaTx.ethUsdPrice?.price.toNumber(),
  };
}
