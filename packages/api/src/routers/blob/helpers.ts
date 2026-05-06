import type {
  BlobscanPrismaClient,
  EthUsdPrice,
  ExtendedBlobDataStorageReferenceSelect,
  Prisma,
} from "@blobscan/db";
import { EthUsdPriceModel } from "@blobscan/db/prisma/zod";
import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";
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
  normalizePrismaBlobDataStorageReferencesFields,
  normalizePrismaTransactionFields,
} from "../../utils";
import {
  baseBlobSchema,
  baseBlockSchema,
  baseTransactionSchema,
  prismaBlobOnTransactionSchema,
} from "../../zod-schemas";

const blobDataStorageReferenceSelect = {
  blobStorage: true,
  dataReference: true,
  url: true,
} satisfies ExtendedBlobDataStorageReferenceSelect;

export const extendedBlobDataStorageReferenceArgs: Prisma.Args<
  BlobscanPrismaClient["blobDataStorageReference"],
  "findFirstOrThrow"
> = {
  select: blobDataStorageReferenceSelect,
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

export type ExtendedBlobDataStorageReference = NonNullable<
  Prisma.Result<
    BlobscanPrismaClient["blobDataStorageReference"],
    { select: typeof blobDataStorageReferenceSelect },
    "findFirst"
  >
>;
type PrismaBlob = Prisma.BlobGetPayload<{
  select: typeof baseBlobSelect;
}> & {
  dataStorageReferences: ExtendedBlobDataStorageReference[];
};

type PrismaBlobOnTransaction = Prisma.BlobsOnTransactionsGetPayload<{
  select: typeof baseBlobOnTransactionSelect;
}>;

export type CompletedPrismaBlob = Prettify<
  PrismaBlob & {
    transactions: Prettify<
      PrismaBlobOnTransaction & {
        block?: ExpandedBlock;
        transaction?: ExpandedTransaction & {
          block: { blobGasPrice: ExpandedBlock["blobGasPrice"] };
        };
      }
    >[];
  }
>;

export type CompletedPrismaBlobOnTransaction = Prettify<
  PrismaBlobOnTransaction & {
    blob: {
      dataStorageReferences: ExtendedBlobDataStorageReference[];
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
    dataStorageReferences: extendedBlobDataStorageReferenceArgs,
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
        dataStorageReferences: extendedBlobDataStorageReferenceArgs,
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
          .partial({
            blobGasBaseUsdFee: true,
            blobGasUsdPrice: true,
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

export function toResponseBlob(
  {
    dataStorageReferences,
    transactions: blobOnTxs,
    ...prismaBlob
  }: CompletedPrismaBlob,
  ethUsdPrices: EthUsdPrice["price"][],
  signedUrls?: Map<string, string>
): ResponseBlob {
  const responseBlob: ResponseBlob = {
    ...prismaBlob,
    dataStorageReferences: normalizePrismaBlobDataStorageReferencesFields(
      dataStorageReferences,
      signedUrls
    ),
    transactions: blobOnTxs.map(
      (
        {
          block: { computeUsdFields, ...restBlock } = {},
          transaction: prismaTx = {},
          ...restBlobOnTx
        },
        i
      ) => {
        const txEthUsdPrice = ethUsdPrices[i];

        const blockUsdFields =
          txEthUsdPrice && computeUsdFields
            ? computeUsdFields(txEthUsdPrice)
            : undefined;
        const txBlock = {
          ...restBlock,
          ...(blockUsdFields ?? {}),
        };

        let responseBlobOnTx: ResponseBlob["transactions"][number] = {
          ...restBlobOnTx,
          ...txBlock,
          ethUsdPrice: txEthUsdPrice?.toNumber(),
        };

        if (isFullyDefined(prismaTx)) {
          const {
            block,
            decodedFields,
            from,
            fromId,
            toId,
            computeBlobGasBaseFee,
            computeUsdFields,
            index: _,
            ...restPrismaTx
          } = prismaTx;

          responseBlobOnTx = {
            ...restPrismaTx,
            ...responseBlobOnTx,
            ...normalizePrismaTransactionFields({
              decodedFields,
              from,
              fromId,
              toId,
            }),
            blobGasBaseFee: computeBlobGasBaseFee(block.blobGasPrice),
            ...(txEthUsdPrice
              ? computeUsdFields({
                  blobGasPrice: block.blobGasPrice,
                  ethUsdPrice: txEthUsdPrice,
                })
              : {}),
          };
        }

        return responseBlobOnTx;
      }
    ),
  };

  return responseBlob;
}

export function toResponseBlobOnTransaction(
  prismaBlobOnTransaction: CompletedPrismaBlobOnTransaction,
  ethUsdPrice?: EthUsdPrice["price"],
  signedUrls?: Map<string, string>
): ResponseBlobOnTransaction {
  const {
    blobHash,
    blob: { dataStorageReferences, ...blob },
    transaction,
    block,
    ...restBlobOnTransaction
  } = prismaBlobOnTransaction;

  const responseBlobOnTx: ResponseBlobOnTransaction = {
    ...blob,
    versionedHash: blobHash,
    dataStorageReferences: normalizePrismaBlobDataStorageReferencesFields(
      dataStorageReferences,
      signedUrls
    ),
    ...restBlobOnTransaction,
  };

  if (transaction) {
    const {
      block: txBlock,
      decodedFields,
      from,
      fromId,
      toId,
      computeBlobGasBaseFee,
      computeUsdFields,
      ...restTx
    } = transaction;

    responseBlobOnTx.transaction = {
      ...restTx,
      blobGasPrice: txBlock.blobGasPrice,
      ...normalizePrismaTransactionFields({
        decodedFields,
        from,
        fromId,
        toId,
      }),
      blobGasBaseFee: computeBlobGasBaseFee(txBlock.blobGasPrice),
      ...(ethUsdPrice
        ? computeUsdFields({
            blobGasPrice: txBlock.blobGasPrice,
            ethUsdPrice,
          })
        : {}),
    };
  }

  if (block) {
    const { computeUsdFields, ...restBlock } = block;
    responseBlobOnTx.block = {
      ...restBlock,
      ...(ethUsdPrice ? computeUsdFields(ethUsdPrice) : {}),
    };
  }

  return responseBlobOnTx;
}

export async function buildSignedUrlsMap(
  dataStorageReferences: ExtendedBlobDataStorageReference[],
  blobStorageManager: BlobStorageManager,
  expirationSeconds?: number
): Promise<Map<string, string>> {
  const signedByDataReference = new Map<string, string>();

  await Promise.all(
    dataStorageReferences.map(async ({ blobStorage, dataReference }) => {
      const storage = blobStorageManager.getStorage(blobStorage);
      if (!storage) return;
      try {
        const signedUrl = await storage.getReadUrl(dataReference, {
          signed: true,
          expirationSeconds,
        });
        if (signedUrl) {
          signedByDataReference.set(dataReference, signedUrl);
        }
      } catch (err) {
        logger.error(
          `Failed to generate signed URL for ${blobStorage} reference "${dataReference}": ${
            (err as Error).message
          }`
        );
      }
    })
  );

  return signedByDataReference;
}

export async function maybeBuildSignedUrlsMap(
  dataStorageReferences: ExtendedBlobDataStorageReference[],
  blobStorageManager: BlobStorageManager | undefined
): Promise<Map<string, string> | undefined> {
  if (!blobStorageManager || !env.GOOGLE_STORAGE_SIGNED_URLS) {
    return undefined;
  }
  return buildSignedUrlsMap(dataStorageReferences, blobStorageManager);
}
