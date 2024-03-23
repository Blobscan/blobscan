import type { Block as DBBlock } from "@blobscan/db";
import { z } from "@blobscan/zod";

import {
  serializeExpandedBlob,
  serializeExpandedTransaction,
  serializedExpandedBlobSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import type {
  ExpandedBlob,
  ExpandedTransaction,
} from "../../../middlewares/withExpands";
import {
  blockNumberSchema,
  serializedDerivedTxBlobGasFieldsSchema,
  serializeDate,
  serializeDecimal,
  serializedBlobDataStorageReferenceSchema,
  slotSchema,
} from "../../../utils";

export const serializedBlockSchema = z.object({
  hash: z.string(),
  number: blockNumberSchema,
  timestamp: z.string(),
  slot: slotSchema,
  blobGasUsed: z.string(),
  blobAsCalldataGasUsed: z.string(),
  blobGasPrice: z.string(),
  excessBlobGas: z.string(),
  transactions: z.array(
    z
      .object({
        hash: z.string(),
        blobs: z.array(
          z
            .object({
              index: z.number(),
              versionedHash: z.string(),
              dataStorageReferences: z.array(
                serializedBlobDataStorageReferenceSchema
              ),
            })
            .merge(serializedExpandedBlobSchema)
        ),
      })
      .merge(serializedExpandedTransactionSchema)
      .merge(serializedDerivedTxBlobGasFieldsSchema)
  ),
});

export type SerializedBlock = z.infer<typeof serializedBlockSchema>;

export type QueriedBlock = Pick<
  DBBlock,
  | "blobAsCalldataGasUsed"
  | "hash"
  | "number"
  | "slot"
  | "timestamp"
  | "blobGasUsed"
  | "blobGasPrice"
  | "excessBlobGas"
> & {
  transactions: ({
    hash: string;
    blobs: {
      index: number;
      blobHash: string;
      blob: ExpandedBlob;
    }[];
  } & ExpandedTransaction)[];
};

export function serializeBlock(block: QueriedBlock): SerializedBlock {
  const {
    blobAsCalldataGasUsed,
    blobGasPrice,
    blobGasUsed,
    excessBlobGas,
    hash,
    number,
    slot,
    timestamp,
    transactions: rawTransactions,
  } = block;

  const transactions = rawTransactions.map(
    (rawTx): SerializedBlock["transactions"][number] => {
      const { hash, blobs } = rawTx;
      const sortedBlobs = blobs.sort((a, b) => a.index - b.index);

      return {
        hash,
        ...serializeExpandedTransaction(rawTx),
        blobs: sortedBlobs.map((blob) => {
          const { index, blobHash, blob: blobData } = blob;

          return {
            index,
            versionedHash: blobHash,
            ...serializeExpandedBlob(blobData),
          };
        }),
      };
    }
  );

  return {
    hash,
    number,
    slot,
    blobAsCalldataGasUsed: serializeDecimal(blobAsCalldataGasUsed),
    blobGasPrice: serializeDecimal(blobGasPrice),
    blobGasUsed: serializeDecimal(blobGasUsed),
    excessBlobGas: serializeDecimal(excessBlobGas),
    timestamp: serializeDate(timestamp),
    transactions,
  };
}
