import type { Block as DBBlock } from "@blobscan/db";
import { z } from "@blobscan/zod";

import {
  serializeExpandedBlobData,
  serializeExpandedTransaction,
  serializedExpandedBlobDataSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import type {
  ExpandedBlobData,
  ExpandedTransaction,
} from "../../../middlewares/withExpands";
import {
  blockNumberSchema,
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
      index?: number;
      blobHash: string;
      blob: ExpandedBlobData;
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

      return {
        hash,
        ...serializeExpandedTransaction(rawTx),
        blobs: blobs.map((blob) => {
          const { blobHash, index, blob: blobData } = blob;

          return {
            versionedHash: blobHash,
            ...(index !== undefined ? { index } : {}),
            ...serializeExpandedBlobData(blobData),
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
