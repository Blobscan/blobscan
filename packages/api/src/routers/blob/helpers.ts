import type { EthUsdPrice, Prisma } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db/prisma/enums";
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
  normalizeDataStorageReferences,
  normalizePrismaTransactionFields,
} from "../../utils/transformers";
import {
  baseBlobSchema,
  baseBlockSchema,
  baseTransactionSchema,
  prismaBlobOnTransactionSchema,
} from "../../zod-schemas";

export const dataStorageReferenceRelation: Prisma.Blob$dataStorageReferencesArgs =
  {
    select: {
      blobStorage: true,
      // Have to ignore this as the Prisma client doesn't detect this computed field from the result extension
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      url: true,
    },
    orderBy: {
      blobStorage: "asc",
    },
  };

export const baseBlobSelect = {
  commitment: true,
  proof: true,
  size: true,
  usageSize: true,
  versionedHash: true,
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
}> & {
  dataStorageReferences: PrismaBlobDataStorageReference[];
};

type PrismaBlobOnTransaction = Prisma.BlobsOnTransactionsGetPayload<{
  select: typeof baseBlobOnTransactionSelect;
}>;

export type PrismaBlobDataStorageReference = {
  blobStorage: BlobStorage;
  url: string;
};

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
      dataStorageReferences: PrismaBlobDataStorageReference[];
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
    dataStorageReferences: dataStorageReferenceRelation,
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
      select: {
        ...baseBlobSelect,
        dataStorageReferences: dataStorageReferenceRelation,
      },
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

export function toResponseBlob({
  dataStorageReferences,
  transactions,
  ...prismaBlob
}: CompletePrismaBlob): ResponseBlob {
  const responseBlobDataStorageRefs = normalizeDataStorageReferences(
    dataStorageReferences
  );
  const responseTransactions = transactions.map(
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
    ...prismaBlob,
    dataStorageReferences: responseBlobDataStorageRefs,
    transactions: responseTransactions,
  };
}

export function toResponseBlobOnTransaction({
  blobHash,
  blob: { dataStorageReferences, ...blob },
  transaction,
  block,
  ...restBlobOnTransaction
}: CompletePrismaBlobOnTransaction): ResponseBlobOnTransaction {
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
    ...blob,
    versionedHash: blobHash,
    dataStorageReferences: normalizeDataStorageReferences(
      dataStorageReferences
    ),
    ...restBlobOnTransaction,
    ...transformedTransaction,
    ...(expandedBlock ? { block: expandedBlock } : {}),
  };
}
