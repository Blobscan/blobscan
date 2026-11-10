import { TRPCError } from "@trpc/server";

import { Prisma } from "@blobscan/db";
import type {
  BlobscanPrismaClient,
  EthUsdPrice,
  ExtendedTransactionSelect,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedBlock,
  Expands,
} from "../../middlewares/withExpands";
import type { Prettify } from "../../types";
import type { AdjacentDirection } from "../../utils";
import {
  adjacentSqlParts,
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
  ethUsdPrice: z.number().optional(),
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

export function createTransactionNotFoundError(hash: string) {
  return new TRPCError({
    code: "NOT_FOUND",
    message: `No transaction with hash '${hash}'.`,
  });
}

/**
 * Returns the transaction with the given hash in the response format of
 * `tx.getByHash`. Throws a `NOT_FOUND` error if the transaction does not
 * exist.
 */
export async function getResponseTransaction(
  prisma: BlobscanPrismaClient,
  expands: Expands,
  hash: string
): Promise<ResponseTransaction> {
  const [prismaTx, ethUsdPrice] = await Promise.all([
    prisma.transaction.findUnique({
      select: createTransactionSelect(expands),
      where: { hash },
    }) as unknown as Promise<CompletedPrismaTransaction | null>,
    prisma.transaction.findEthUsdPrice(hash),
  ]);

  if (!prismaTx) {
    throw createTransactionNotFoundError(hash);
  }

  return toResponseTransaction(prismaTx, ethUsdPrice?.price);
}

/**
 * Returns a `LATERAL` subquery that gets the hash of the previous or the next
 * transaction of a sender. The order is block timestamp, then transaction
 * index. The subquery does not return transactions of reorged blocks.
 *
 * The outer query must have a `cur` row with the `from_id`, `block_timestamp`
 * and `tx_index` columns of the current transaction. The `LATERAL` join gives
 * these values to the inner index scan as parameters. Therefore Postgres uses
 * the tuple comparison and `from_id = …` as the `Index Cond` of the
 * `(from_id, block_timestamp, index)` index. The scan starts at the current
 * transaction and stops at the first transaction that is not reorged.
 *
 * Do not get the current transaction from a CTE and join it in the subquery.
 * Postgres then applies the tuple comparison as a join filter, not as an index
 * condition. The scan then starts at one end of the index and can read all
 * the rows of the table.
 */
export function senderAdjacentTxSql(direction: AdjacentDirection) {
  const { operator, order } = adjacentSqlParts(direction);

  return Prisma.sql`
    SELECT t.hash
    FROM transaction t
    WHERE t.from_id = cur.from_id
      AND (t.from_id, t.block_timestamp, t.index) ${operator} (cur.from_id, cur.block_timestamp, cur.tx_index)
      AND NOT EXISTS (
        SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
      )
    ORDER BY t.from_id ${order}, t.block_timestamp ${order}, t.index ${order}
    LIMIT 1
  `;
}
