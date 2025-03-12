import {
  AddressModel,
  BlobsOnTransactionsModel,
  BlockModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import type { optimismDecodedFieldsSchema } from "@blobscan/db/prisma/zod-utils";
import {
  toCategorySchema,
  nullishRollupSchema,
  toISODateSchema,
  stringifyDecimalSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import {
  expandedBlobSchema,
  expandedBlockSchema,
  serializedExpandedBlobSchema,
  serializedExpandedBlockSchema,
} from "../../../middlewares/withExpands";
import {
  isEmptyObject,
  serializedTransactionFeeFieldsSchema,
  transactionFeeFieldsSchema,
} from "../../../utils";

export const transactionSchema = TransactionModel.omit({
  insertedAt: true,
  updatedAt: true,
})
  .merge(transactionFeeFieldsSchema)
  .extend({
    block: expandedBlockSchema
      .partial({
        blobAsCalldataGasUsed: true,
        blobGasUsed: true,
        excessBlobGas: true,
        slot: true,
      })
      .merge(BlockModel.pick({ blobGasPrice: true })),
    blobs: z.array(
      BlobsOnTransactionsModel.pick({
        blobHash: true,
      }).extend({
        blob: expandedBlobSchema.partial().optional(),
      })
    ),
    from: AddressModel.pick({
      address: true,
      rollup: true,
    }),
  });

export const serializedTransactionSchema = transactionSchema.transform(
  ({
    block,
    blobs,
    blockTimestamp,
    blobAsCalldataGasUsed,
    blobGasUsed,
    maxFeePerBlobGas,
    fromId,
    from,
    toId,
    gasPrice: _,
    decodedFields,
    ...restTransaction
  }) => {
    const { blobGasPrice, ...restExpandedBlock } = block;
    const serializedTransactionFeeFields =
      serializedTransactionFeeFieldsSchema.parse(restTransaction);
    const serializedExpandedBlock = {
      block: {
        blobGasPrice: stringifyDecimalSchema.parse(blobGasPrice),
        ...(!isEmptyObject(restExpandedBlock)
          ? serializedExpandedBlockSchema.parse(block)
          : {}),
      },
    };
    const serializedExpandedBlobs = blobs.map(({ blob, blobHash }) => {
      const serializedExpandedBlobFields = blob
        ? serializedExpandedBlobSchema.parse(blob)
        : undefined;

      return {
        versionedHash: blobHash,
        ...(serializedExpandedBlobFields || {}),
      };
    });

    return {
      ...restTransaction,
      ...serializedTransactionFeeFields,
      blobAsCalldataGasUsed: stringifyDecimalSchema.parse(
        blobAsCalldataGasUsed
      ),
      blobGasUsed: stringifyDecimalSchema.parse(blobGasUsed),
      blockTimestamp: toISODateSchema.parse(blockTimestamp),
      category: toCategorySchema.parse(from.rollup ? "ROLLUP" : "OTHER"),
      rollup: nullishRollupSchema.parse(from.rollup),
      decodedFields: isEmptyObject(decodedFields)
        ? null
        : (decodedFields as z.infer<typeof optimismDecodedFieldsSchema>),
      from: fromId,
      maxFeePerBlobGas: stringifyDecimalSchema.parse(maxFeePerBlobGas),
      to: toId,
      ...(serializedExpandedBlock || {}),
      blobs: serializedExpandedBlobs,
    };
  }
);

export type SerializedTransaction = z.infer<typeof serializedTransactionSchema>;

export type Transaction = z.input<typeof transactionSchema>;
