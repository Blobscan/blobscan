import {
  BlobsOnTransactionsModel,
  BlockModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import {
  toISODateSchema,
  stringifyDecimalSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { serializedExpandedTransactionSchema } from "../../../middlewares/withExpands";
import {
  expandedBlobSchema,
  expandedTransactionSchema,
  serializedExpandedBlobSchema,
} from "../../../middlewares/withExpands";

export const blockSchema = BlockModel.omit({
  insertedAt: true,
  updatedAt: true,
}).extend({
  transactions: z.array(
    TransactionModel.pick({
      hash: true,
    })
      .extend({
        blobs: z.array(
          BlobsOnTransactionsModel.pick({
            blobHash: true,
          }).extend({
            blob: expandedBlobSchema.partial().optional(),
          })
        ),
      })
      .merge(expandedTransactionSchema.partial())
  ),
});

export const serializedBlockSchema = blockSchema.transform(
  ({
    blobAsCalldataGasUsed,
    blobGasPrice,
    blobGasUsed,
    excessBlobGas,
    timestamp,
    transactions,
    ...restBlock
  }) => {
    return {
      ...restBlock,
      blobAsCalldataGasUsed: stringifyDecimalSchema.parse(
        blobAsCalldataGasUsed
      ),
      blobGasPrice: stringifyDecimalSchema.parse(blobGasPrice),
      blobGasUsed: stringifyDecimalSchema.parse(blobGasUsed),
      excessBlobGas: stringifyDecimalSchema.parse(excessBlobGas),
      timestamp: toISODateSchema.parse(timestamp),
      transactions: transactions.map(
        ({ hash, blobs, ...expandedTransaction }) => {
          const serializedExpandedTransaction =
            expandedTransaction && Object.values(expandedTransaction).length
              ? serializedExpandedTransactionSchema.parse(expandedTransaction)
              : undefined;

          return {
            ...(serializedExpandedTransaction || {}),
            hash,
            blobs: blobs.map(({ blobHash, blob }) => {
              const serializedExpandedBlob =
                blob && Object.values(blob).length
                  ? serializedExpandedBlobSchema.parse(blob)
                  : undefined;

              return {
                versionedHash: blobHash,
                ...serializedExpandedBlob,
              };
            }),
          };
        }
      ),
    };
  }
);

export type Block = z.input<typeof blockSchema>;

export type SerializedBlock = z.output<typeof serializedBlockSchema>;
