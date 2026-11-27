import type {
  BlobscanPrismaClient,
  EthUsdPrice,
  ExtendedBlobDataStorageReferenceSelect,
  Prisma,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedBlock,
  ExpandedTransaction,
  Expands,
} from "../../middlewares/withExpands";
import type { Filters } from "../../middlewares/withFilters";
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
    _count: { transactions: number };
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

export function createBlobListWhere({
  blockFilters = {},
  blockType,
  transactionFilters,
}: Filters): Prisma.BlobsOnTransactionsWhereInput {
  return {
    blockNumber: blockFilters.number,
    blockTimestamp: blockFilters.timestamp,
    block: {
      slot: blockFilters.slot,
      transactionForks: blockType,
    },
    transaction: transactionFilters,
  };
}

/**
 * The page of a blob's transactions to return. A blob is normally in one
 * transaction, but a blob can be posted again: mainnet has 2024 blobs in tens
 * of thousands of transactions (0x01f3ee17...: 38,624, a 54 MB response that
 * took 77 s and ~800 MiB to build). Without a limit every transaction is
 * returned, as before; `transactionCount` always has the total.
 */
export const MAX_BLOB_TRANSACTIONS_LIMIT = 1000;

export const blobTransactionsPageSchema = z.object({
  transactionsLimit: z
    .number()
    .int()
    .positive()
    .max(MAX_BLOB_TRANSACTIONS_LIMIT)
    .optional(),
  transactionsOffset: z.number().int().nonnegative().optional(),
});

export type BlobTransactionsPage = z.infer<typeof blobTransactionsPageSchema>;

export function createBlobSelect(
  expands: Expands,
  { transactionsLimit, transactionsOffset }: BlobTransactionsPage = {}
) {
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
      // Newest first. The other keys make the order total, so that the pages
      // of a blob with many transactions in one block do not overlap.
      orderBy: [
        { blockNumber: "desc" },
        { txIndex: "asc" },
        { index: "asc" },
        { txHash: "asc" },
      ],
      take: transactionsLimit,
      skip: transactionsOffset,
    },
    _count: {
      select: { transactions: true },
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
  // All the transactions of the blob, also those not in `transactions`.
  transactionCount: z.number().int().nonnegative(),
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
        ethUsdPrice: z.number().optional(),
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

/**
 * @param ethUsdPrices The ETH/USD price of each transaction, in the order of
 * `transactions`; `undefined` where there is no price.
 */
export function toResponseBlob(
  {
    _count,
    dataStorageReferences,
    transactions: blobOnTxs,
    ...prismaBlob
  }: CompletedPrismaBlob,
  ethUsdPrices: (EthUsdPrice["price"] | undefined)[]
): ResponseBlob {
  const responseBlob: ResponseBlob = {
    ...prismaBlob,
    transactionCount: _count.transactions,
    dataStorageReferences: normalizePrismaBlobDataStorageReferencesFields(
      dataStorageReferences
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
  ethUsdPrice?: EthUsdPrice["price"]
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
      dataStorageReferences
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

/**
 * Gets a blob by its versioned hash or KZG commitment, in the response format
 * of `blob.getByBlobId`. Returns `null` if the blob does not exist.
 *
 * All the procedures that return a blob for the `getByBlobId` cache must use
 * this function, so that the cached data has the same format.
 */
export async function findResponseBlob(
  prisma: BlobscanPrismaClient,
  expands: Expands,
  id: string,
  transactionsPage: BlobTransactionsPage = {}
): Promise<ResponseBlob | null> {
  const isExpandEnabled = !!expands.block || !!expands.transaction;

  const prismaBlob = (await prisma.blob.findFirst({
    select: createBlobSelect(expands, transactionsPage),
    where: {
      OR: [{ versionedHash: id }, { commitment: id }],
    },
  })) as unknown as CompletedPrismaBlob | null;

  if (!prismaBlob) {
    return null;
  }

  const ethUsdPrices = isExpandEnabled
    ? await findTransactionsEthUsdPrices(prisma, prismaBlob.transactions)
    : [];

  return toResponseBlob(prismaBlob, ethUsdPrices);
}

/**
 * The ETH/USD price of each transaction, at the minute of its block, in the
 * order of `transactions`; `undefined` where there is no price for that minute.
 *
 * Only the prices of the transactions returned are read. The former query
 * (`prisma.blob.findEthUsdPrices`) read the prices of all the transactions of
 * the blob and matched them by position, so a transaction without a price
 * moved the price of every later transaction to its neighbour, and it never
 * found a price for a blob looked up by KZG commitment.
 */
async function findTransactionsEthUsdPrices(
  prisma: BlobscanPrismaClient,
  transactions: { blockTimestamp: Date }[]
): Promise<(EthUsdPrice["price"] | undefined)[]> {
  const toMinute = (timestamp: Date) =>
    Math.floor(timestamp.getTime() / 60_000) * 60_000;
  const minutes = [
    ...new Set(
      transactions.map(({ blockTimestamp }) => toMinute(blockTimestamp))
    ),
  ];

  if (!minutes.length) {
    return [];
  }

  const prices = await prisma.ethUsdPrice.findMany({
    select: { price: true, timestamp: true },
    where: { timestamp: { in: minutes.map((minute) => new Date(minute)) } },
  });
  const priceByMinute = new Map(
    prices.map(({ price, timestamp }) => [timestamp.getTime(), price])
  );

  return transactions.map(({ blockTimestamp }) =>
    priceByMinute.get(toMinute(blockTimestamp))
  );
}
