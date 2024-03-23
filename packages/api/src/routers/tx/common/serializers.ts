import { z } from "@blobscan/zod";

import {
  serializeExpandedBlob,
  serializeExpandedBlock,
  serializedExpandedBlobSchema,
  serializedExpandedBlockSchema,
} from "../../../middlewares/withExpands";
import {
  rollupSchema,
  serializeDecimal,
  serializeRollup,
  isEmptyObject,
  serializeDerivedTxBlobGasFields,
  serializedDerivedTxBlobGasFieldsSchema,
  calculateDerivedTxBlobGasFields,
} from "../../../utils";
import type { FullQueriedTransaction, BaseTransaction } from "./selects";

const baseSerializedTransactionFieldsSchema = z.object({
  hash: z.string(),
  blockNumber: z.number(),
  blockHash: z.string(),
  from: z.string(),
  to: z.string(),
  maxFeePerBlobGas: z.string(),
  blobAsCalldataGasUsed: z.string(),
  rollup: rollupSchema.nullable(),
  blobs: z.array(
    z
      .object({
        versionedHash: z.string(),
        index: z.number(),
      })
      .merge(serializedExpandedBlobSchema)
  ),
  block: serializedExpandedBlockSchema.optional(),
});

export const serializedTransactionSchema =
  baseSerializedTransactionFieldsSchema.merge(
    serializedDerivedTxBlobGasFieldsSchema
  );

type SerializedBaseTransactionFields = z.infer<
  typeof baseSerializedTransactionFieldsSchema
>;

export type SerializedTransaction = z.infer<typeof serializedTransactionSchema>;

export function addDerivedFieldsToTransaction(
  txQuery: BaseTransaction
): FullQueriedTransaction {
  const { block, blobs, maxFeePerBlobGas } = txQuery;

  return {
    ...txQuery,
    ...calculateDerivedTxBlobGasFields({
      blobGasPrice: block.blobGasPrice,
      txBlobsLength: blobs.length,
      maxFeePerBlobGas,
    }),
  };
}

export function serializeBaseTransactionFields(
  txQuery: BaseTransaction
): SerializedBaseTransactionFields {
  const { hash, blockHash, fromId, toId, rollup, blobs, block } = txQuery;
  const { number } = block;
  const sortedBlobs: SerializedBaseTransactionFields["blobs"] = blobs
    .sort((a, b) => a.index - b.index)
    .map(({ blob, blobHash, index }) => {
      return {
        versionedHash: blobHash,
        index: index,
        ...serializeExpandedBlob(blob),
      };
    });

  const expandedBlock = serializeExpandedBlock(block);

  return {
    hash,
    blockNumber: number,
    blockHash,
    to: toId,
    from: fromId,
    blobAsCalldataGasUsed: serializeDecimal(txQuery.blobAsCalldataGasUsed),
    maxFeePerBlobGas: serializeDecimal(txQuery.maxFeePerBlobGas),
    rollup: serializeRollup(rollup),
    blobs: sortedBlobs,
    ...(isEmptyObject(expandedBlock) ? {} : { block: expandedBlock }),
  };
}

export function serializeTransaction(
  txQuery: FullQueriedTransaction
): SerializedTransaction {
  const serializedBaseTx = serializeBaseTransactionFields(txQuery);
  const serializedAdditionalTx = serializeDerivedTxBlobGasFields(txQuery);

  return {
    ...serializedBaseTx,
    ...serializedAdditionalTx,
  };
}
