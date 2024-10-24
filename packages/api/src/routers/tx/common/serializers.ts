import { z } from "@blobscan/zod";

import {
  serializeExpandedBlobData,
  serializeExpandedBlock,
  serializedExpandedBlobDataSchema,
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
  serializeDate,
  categorySchema,
  serializeCategory,
} from "../../../utils";
import type { FullQueriedTransaction, BaseTransaction } from "./selects";

const baseSerializedTransactionFieldsSchema = z.object({
  hash: z.string(),
  blockNumber: z.number(),
  blockTimestamp: z.string(),
  blockHash: z.string(),
  index: z.number().nullable(),
  from: z.string(),
  to: z.string(),
  maxFeePerBlobGas: z.string(),
  blobGasUsed: z.string(),
  blobAsCalldataGasUsed: z.string(),
  category: categorySchema,
  rollup: rollupSchema.nullable(),
  blobs: z.array(
    z
      .object({
        versionedHash: z.string(),
        index: z.number(),
      })
      .merge(serializedExpandedBlobDataSchema)
  ),
  block: serializedExpandedBlockSchema.optional(),
  decodedFields: z.string().optional(),
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
  const {
    blobAsCalldataGasUsed,
    blobGasUsed,
    block,
    gasPrice,
    maxFeePerBlobGas,
  } = txQuery;

  return {
    ...txQuery,
    ...calculateDerivedTxBlobGasFields({
      blobGasUsed,
      blobAsCalldataGasUsed,
      gasPrice,
      blobGasPrice: block.blobGasPrice,
      maxFeePerBlobGas,
    }),
  };
}

export function serializeBaseTransactionFields(
  txQuery: BaseTransaction
): SerializedBaseTransactionFields {
  const {
    hash,
    blockHash,
    blockNumber,
    blockTimestamp,
    index,
    fromId,
    toId,
    category,
    rollup,
    blobs,
    block,
  } = txQuery;
  const expandedBlock = serializeExpandedBlock(block);

  return {
    hash,
    blockNumber: blockNumber,
    blockTimestamp: serializeDate(blockTimestamp),
    blockHash,
    index,
    to: toId,
    from: fromId,
    blobAsCalldataGasUsed: serializeDecimal(txQuery.blobAsCalldataGasUsed),
    blobGasUsed: serializeDecimal(txQuery.blobGasUsed),
    maxFeePerBlobGas: serializeDecimal(txQuery.maxFeePerBlobGas),
    category: serializeCategory(category),
    rollup: serializeRollup(rollup),
    blobs: blobs.map(({ blob, blobHash, index }) => {
      return {
        versionedHash: blobHash,
        index: index,
        ...serializeExpandedBlobData(blob),
      };
    }),
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
    decodedFields: JSON.stringify(txQuery.decodedFields),
  };
}
