import type { EthUsdPrice, Prisma } from "@blobscan/db";
import { EthUsdPriceModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedBlock,
  ExpandedTransaction,
  Expands,
} from "../../middlewares/withExpands";
import type { Prettify } from "../../types";
import { isFullyDefined } from "../../utils";
import {
  deriveBlockFields,
  deriveTransactionFields,
  normalizePrismaBlobFields,
  normalizePrismaTransactionFields,
} from "../../utils/transformers";
import {
  baseBlobSchema,
  baseBlockSchema,
  baseTransactionSchema,
  prismaBlobOnTransactionSchema,
} from "../../zod-schemas";

const dataStorageReferenceSelect = {
  blobStorage: true,
  dataReference: true,
} satisfies Prisma.BlobDataStorageReferenceSelect;
5;
export const baseBlobSelect = {
  commitment: true,
  proof: true,
  size: true,
  versionedHash: true,
  dataStorageReferences: {
    select: dataStorageReferenceSelect,
    orderBy: {
      blobStorage: "asc",
    },
  },
} satisfies Prisma.BlobSelect;

export const baseBlobOnTransactionSelect = {
  blobHash: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  index: true,
  txHash: true,
  txIndex: true,
} satisfies Prisma.BlobsOnTransactionsSelect;

type PrismaBlob = Prisma.BlobGetPayload<{
  select: typeof baseBlobSelect;
}>;

type PrismaBlobOnTransaction = Prisma.BlobsOnTransactionsGetPayload<{
  select: typeof baseBlobOnTransactionSelect;
}>;

type DataStorageReference = Prisma.BlobDataStorageReferenceGetPayload<{
  select: typeof dataStorageReferenceSelect;
}>;

export type CompletePrismaBlob = Prettify<
  PrismaBlob & {
    transactions: Prettify<
      PrismaBlobOnTransaction & {
        block?: ExpandedBlock;
        transaction?: ExpandedTransaction & {
          block: { blobGasPrice: ExpandedBlock["blobGasPrice"] };
        };
      } & { ethUsdPrice?: EthUsdPrice }
    >[];
  }
>;

export type CompletePrismaBlobOnTransaction = Prettify<
  PrismaBlobOnTransaction & {
    blob: {
      dataStorageReferences: DataStorageReference[];
    } & ExpandedBlob;
    block?: ExpandedBlock;
    transaction?: ExpandedTransaction & {
      block: { blobGasPrice: ExpandedBlock["blobGasPrice"] };
    };
  }
>;
export function createBlobSelect(expands: Expands) {
  const blockExpand = expands.block ? { block: expands.block } : {};
  const txExpand = expands.transaction
    ? {
        transaction: {
          select: {
            ...expands.transaction.select,
            block: {
              select: {
                blobGasPrice: true,
              },
            },
          },
        },
      }
    : {};

  return {
    ...baseBlobSelect,
    transactions: {
      select: {
        ...baseBlobOnTransactionSelect,
        ...blockExpand,
        ...txExpand,
      },
      orderBy: {
        blockNumber: "desc",
      },
    },
  } satisfies Prisma.BlobSelect;
}

export function createBlobsOnTransactionsSelect(expands: Expands) {
  const blockExpand = expands.block ? { block: expands.block } : {};
  const txExpand = expands.transaction
    ? {
        transaction: {
          select: {
            ...expands.transaction.select,
            block: {
              select: {
                blobGasPrice: true,
              },
            },
          },
        },
      }
    : {};

  return {
    ...baseBlobOnTransactionSelect,
    blob: {
      select: baseBlobSelect,
    },
    ...txExpand,
    ...blockExpand,
  } satisfies Prisma.BlobsOnTransactionsSelect;
}

const responseBlobOnTxSchema = prismaBlobOnTransactionSchema
  .omit({ blobHash: true })
  .required({
    blockHash: true,
    blockNumber: true,
    blockTimestamp: true,
    index: true,
    txHash: true,
    txIndex: true,
  });

export const responseBlobSchema = baseBlobSchema.extend({
  transactions: z.array(
    responseBlobOnTxSchema
      .merge(
        baseTransactionSchema
          .omit({
            hash: true,
            blockNumber: true,
            blockTimestamp: true,
            blockHash: true,
          })
          .partial()
      )
      .extend({
        block: baseBlockSchema
          .omit({
            hash: true,
            number: true,
            timestamp: true,
          })
          .optional(),
        ethUsdPrice: EthUsdPriceModel.shape.price.optional(),
      })
  ),
});

export const responseBlobOnTransactionSchema = responseBlobOnTxSchema
  .merge(baseBlobSchema)
  .extend({
    block: baseBlockSchema
      .omit({
        hash: true,
        number: true,
        timestamp: true,
      })
      .optional(),
    transaction: baseTransactionSchema
      .omit({
        hash: true,
        blockNumber: true,
        blockTimestamp: true,
        blockHash: true,
      })
      .optional(),
  });

export type ResponseBlob = z.input<typeof responseBlobSchema>;
export type ResponseBlobOnTransaction = z.input<
  typeof responseBlobOnTransactionSchema
>;

export function toResponseBlob(prismaBlob: CompletePrismaBlob): ResponseBlob {
  const normalizedPrismaBlob = normalizePrismaBlobFields(prismaBlob);
  const transactions = prismaBlob.transactions.map(
    ({ block, transaction: prismaTx = {}, ethUsdPrice, ...restBlobOnTx }) => {
      const { block: prismaTxBlock, index: _, ...restPrismaTx } = prismaTx;

      return {
        ...restBlobOnTx,
        ...(isFullyDefined(restPrismaTx) && prismaTxBlock
          ? {
              ...restPrismaTx,
              ...normalizePrismaTransactionFields(restPrismaTx),
              ...deriveTransactionFields({
                ...restPrismaTx,
                blobGasPrice: prismaTxBlock.blobGasPrice,
                ethUsdPrice,
              }),
            }
          : {}),
        ...(block
          ? {
              block: {
                ...block,
                ...deriveBlockFields({
                  blobGasPrice: block.blobGasPrice,
                  blobGasUsed: block.blobGasUsed,
                  ethUsdPrice,
                }),
              },
            }
          : {}),
        ethUsdPrice: ethUsdPrice?.price.toNumber(),
      };
    }
  );

  return {
    ...normalizedPrismaBlob,
    transactions,
  };
}

export function toResponseBlobOnTransaction({
  blobHash,
  blob,
  transaction,
  block,
  ...restBlobOnTransaction
}: CompletePrismaBlobOnTransaction): ResponseBlobOnTransaction {
  const normalizedPrismaBlob = normalizePrismaBlobFields({
    versionedHash: blobHash,
    ...blob,
  });
  const transformedTransaction = transaction
    ? {
        transaction: {
          ...transaction,
          ...normalizePrismaTransactionFields(transaction),
          ...deriveTransactionFields({
            ...transaction,
            blobGasPrice: transaction.block.blobGasPrice,
          }),
        },
      }
    : {};
  const expandedBlock = block
    ? {
        ...block,
        ...deriveBlockFields(block),
      }
    : undefined;

  return {
    ...restBlobOnTransaction,
    ...normalizedPrismaBlob,
    ...transformedTransaction,
    ...(expandedBlock ? { block: expandedBlock } : {}),
  };
}
