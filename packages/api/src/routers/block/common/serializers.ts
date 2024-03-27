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
              index: z.number(),
              versionedHash: z.string(),
              dataStorageReferences: z.array(
                serializedBlobDataStorageReferenceSchema
              ),
            })
            .merge(serializedExpandedBlobDataSchema)
        ),
      })
      .merge(
        serializedExpandedTransactionSchema.merge(
          z.object({
            blobGasBaseFee: z.string().optional(),
            blobGasMaxFee: z.string().optional(),
            blobGasUsed: z.string().optional(),
          })
        )
      )
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

  const transactions = rawTransactions
    .sort((a, b) => a.hash.localeCompare(b.hash))
    .map((rawTx): SerializedBlock["transactions"][number] => {
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
            ...serializeExpandedBlobData(blobData),
          };
        }),
      };
    });

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
