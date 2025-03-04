import { z } from "@blobscan/zod";

import {
  decodedFields,
  parseDecodedFields,
} from "../../../blob-parse/parse-decoded-fields";
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
  serializeTxFeeFields,
  serializedTxFeeFieldsSchema,
  serializeDate,
  categorySchema,
  serializeCategory,
} from "../../../utils";
import type { Transaction, IncompletedTransaction } from "./selects";

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
  decodedFields: decodedFields.optional(),
});

export const serializedTransactionSchema =
  baseSerializedTransactionFieldsSchema.merge(serializedTxFeeFieldsSchema);

type SerializedBaseTransactionFields = z.infer<
  typeof baseSerializedTransactionFieldsSchema
>;

export type SerializedTransaction = z.infer<typeof serializedTransactionSchema>;

export function serializeBaseTransactionFields(
  dbTx: IncompletedTransaction
): SerializedBaseTransactionFields {
  const {
    hash,
    blockHash,
    blockNumber,
    blockTimestamp,
    index,
    from: { address: fromAddress, rollup },
    toId,
    category,
    block,
  } = dbTx;
  const expandedBlock = serializeExpandedBlock(block);

  return {
    hash,
    blockNumber: blockNumber,
    blockTimestamp: serializeDate(blockTimestamp),
    blockHash,
    index,
    to: toId,
    from: fromAddress,
    blobAsCalldataGasUsed: serializeDecimal(dbTx.blobAsCalldataGasUsed),
    blobGasUsed: serializeDecimal(dbTx.blobGasUsed),
    maxFeePerBlobGas: serializeDecimal(dbTx.maxFeePerBlobGas),
    category: serializeCategory(category),
    rollup: serializeRollup(rollup),
    ...(isEmptyObject(expandedBlock) ? {} : { block: expandedBlock }),
    blobs: dbTx.blobs.map(({ blob, blobHash }) => {
      const serializedExpandedBlobFields = blob
        ? serializeExpandedBlobData(blob)
        : {};

      return {
        versionedHash: blobHash,
        ...serializedExpandedBlobFields,
      };
    }),
  };
}

export function serializeTransaction(tx: Transaction): SerializedTransaction {
  const serializedBaseTx = serializeBaseTransactionFields(tx);
  const serializedTxFeeFields = serializeTxFeeFields(tx);

  const decodedFieldsString = JSON.stringify(tx.decodedFields);
  const decodedFields = parseDecodedFields(decodedFieldsString);

  return {
    ...serializedBaseTx,
    ...serializedTxFeeFields,
    decodedFields,
  };
}
