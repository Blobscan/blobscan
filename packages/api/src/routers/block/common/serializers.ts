import { z } from "@blobscan/zod";

import {
  serializeExpandedBlobData,
  serializeExpandedTransaction,
  serializedExpandedBlobDataSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import {
  blockNumberSchema,
  serializeDate,
  serializeDecimal,
  serializedBlobDataStorageReferenceSchema,
  slotSchema,
} from "../../../utils";
import type { BaseBlock, Block } from "./selects";

export const serializedBaseBlockSchema = z.object({
  hash: z.string(),
  number: blockNumberSchema,
  timestamp: z.string(),
  slot: slotSchema,
  blobGasUsed: z.string(),
  blobAsCalldataGasUsed: z.string(),
  blobGasPrice: z.string(),
  excessBlobGas: z.string(),
});

export const serializedBlockSchema = serializedBaseBlockSchema.merge(
  z.object({
    transactions: z.array(
      z
        .object({
          hash: z.string(),
          blobs: z.array(
            z
              .object({
                versionedHash: z.string(),
                dataStorageReferences: z.array(
                  serializedBlobDataStorageReferenceSchema
                ),
              })
              .merge(serializedExpandedBlobDataSchema)
          ),
        })
        .merge(serializedExpandedTransactionSchema)
    ),
  })
);

type SerializedBaseBlock = z.infer<typeof serializedBaseBlockSchema>;

export type SerializedBlock = z.infer<typeof serializedBlockSchema>;

function serializeBaseBlock({
  blobAsCalldataGasUsed,
  blobGasPrice,
  blobGasUsed,
  excessBlobGas,
  hash,
  number,
  slot,
  timestamp,
}: BaseBlock): SerializedBaseBlock {
  return {
    hash,
    number,
    slot,
    blobAsCalldataGasUsed: serializeDecimal(blobAsCalldataGasUsed),
    blobGasPrice: serializeDecimal(blobGasPrice),
    blobGasUsed: serializeDecimal(blobGasUsed),
    excessBlobGas: serializeDecimal(excessBlobGas),
    timestamp: serializeDate(timestamp),
  };
}

export function serializeBlock({
  transactions: rawTransactions,
  ...baseBlock
}: Block): SerializedBlock {
  const transactions = rawTransactions.map(
    ({ hash, blobs: blobsOnTxs, ...restTransaction }) => {
      const blobs = blobsOnTxs.map((bTx) => {
        const { blobHash, blob } = bTx;
        const expandedBlob = blob ? serializeExpandedBlobData(blob) : {};

        return {
          versionedHash: blobHash,
          ...expandedBlob,
        };
      });
      const expandedTransaction = serializeExpandedTransaction(restTransaction);

      return {
        hash,
        blobs,
        ...expandedTransaction,
      };
    }
  );

  const serializedBlock: SerializedBlock = {
    ...serializeBaseBlock(baseBlock),
    transactions,
  };

  return serializedBlock;
}
