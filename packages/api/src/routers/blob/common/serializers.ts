import {
  BlobDataStorageReferenceModel,
  BlobModel,
  BlobsOnTransactionsModel,
  BlockModel,
} from "@blobscan/db/prisma/zod";
import {
  blobStorageSchema,
  toISODateSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import {
  expandedBlockSchema,
  expandedTransactionSchema,
  serializedExpandedBlockSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import { buildBlobDataUrl } from "../../../utils";

export const serializedBlobDataStorageReferenceSchema =
  BlobDataStorageReferenceModel.omit({ blobHash: true }).transform(
    ({ blobStorage, dataReference }) => ({
      storage: blobStorageSchema.parse(blobStorage),
      url: buildBlobDataUrl(blobStorage, dataReference),
    })
  );

export const blobBaseSchema = BlobModel.omit({
  firstBlockNumber: true,
  insertedAt: true,
  updatedAt: true,
}).extend({
  dataStorageReferences: z.array(
    BlobDataStorageReferenceModel.pick({
      blobStorage: true,
      dataReference: true,
    })
  ),
});

export const serializedBlobBaseSchema = blobBaseSchema.transform(
  ({ dataStorageReferences, ...restBlob }) => ({
    ...restBlob,
    dataStorageReferences: dataStorageReferences.map((ref) =>
      serializedBlobDataStorageReferenceSchema.parse(ref)
    ),
  })
);

export const blobSchema = blobBaseSchema.extend({
  data: z.string(),
  transactions: z.array(
    BlobsOnTransactionsModel.omit({ blobHash: true }).extend({
      block: expandedBlockSchema.partial().optional(),
      transaction: expandedTransactionSchema
        .merge(z.object({ block: BlockModel.pick({ blobGasPrice: true }) }))
        .partial()
        .optional(),
    })
  ),
});

export const serializedBlobSchema = blobSchema.transform(
  ({ data, transactions, ...restBlob }) => {
    const serializedBlob = serializedBlobBaseSchema.parse(restBlob);

    return {
      ...serializedBlob,
      data,
      transactions: transactions.map(
        ({ block, transaction, blockTimestamp, txHash, ...restBlobOnTx }) => {
          const serializedExpandedTransaction = transaction
            ? serializedExpandedTransactionSchema.parse(transaction)
            : undefined;
          const serializedExpandedBlock = block
            ? { block: serializedExpandedBlockSchema.parse(block) }
            : undefined;

          return {
            ...restBlobOnTx,
            hash: txHash,
            blockTimestamp: toISODateSchema.parse(blockTimestamp),
            ...(serializedExpandedTransaction || {}),
            ...(serializedExpandedBlock || {}),
          };
        }
      ),
    };
  }
);
export const blobsOnTransactionsSchema = BlobsOnTransactionsModel.omit({
  blobHash: true,
}).extend({
  blob: blobBaseSchema,
  block: expandedBlockSchema.partial().optional(),
  transaction: expandedTransactionSchema
    .merge(z.object({ block: BlockModel.pick({ blobGasPrice: true }) }))
    .partial()
    .optional(),
});

export const serializedBlobsOnTransactionsSchema =
  blobsOnTransactionsSchema.transform(
    ({
      blob,
      block,
      transaction,
      blockTimestamp,
      ...restBlobOnTransaction
    }) => {
      const serializedBlock = block
        ? { block: serializedExpandedBlockSchema.parse(block) }
        : undefined;
      const serializedTx = transaction
        ? {
            transaction: serializedExpandedTransactionSchema.parse(transaction),
          }
        : undefined;
      const serializedBlob = serializedBlobBaseSchema.parse(blob);

      return {
        ...(serializedTx ? serializedTx : {}),
        ...restBlobOnTransaction,
        ...serializedBlob,
        blockTimestamp: toISODateSchema.parse(blockTimestamp),
        ...(serializedBlock ? serializedBlock : {}),
      };
    }
  );

export type Blob = z.input<typeof blobSchema>;
export type BlobOnTransaction = z.input<typeof blobsOnTransactionsSchema>;
export type SerializedBlob = z.infer<typeof serializedBlobSchema>;
export type SerializedBlobsOnTransactions = z.infer<
  typeof serializedBlobsOnTransactionsSchema
>;
