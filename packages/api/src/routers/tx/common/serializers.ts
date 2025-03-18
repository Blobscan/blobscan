import type { Prisma } from "@blobscan/db";
import { Category } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import type { PrismaTransaction } from "../../../schemas";
import {
  prismaBlobOnTransactionSchema,
  prismaBlockSchema,
  prismaTransactionSchema,
} from "../../../schemas";
import { isEmptyObject, serialize } from "../../../utils";
import { transformPrismaBlobOnTx } from "../../blob/common";

export const fullPrismaTransactionSchema = prismaTransactionSchema.extend({
  blobs: z.array(prismaBlobOnTransactionSchema.required({ blobHash: true })),
  block: prismaBlockSchema
    .omit({
      hash: true,
      number: true,
      timestamp: true,
    })
    .partial()
    .required({
      blobGasPrice: true,
    }),
});

export type FullPrismaTransaction = z.infer<typeof fullPrismaTransactionSchema>;

export function transformPrismaTransaction(
  prismaTx: Partial<FullPrismaTransaction> | Partial<PrismaTransaction>,
  blobGasPrice?: Prisma.Decimal
) {
  const parsedPrismaTx = prismaTransactionSchema
    .partial({
      hash: true,
      blockNumber: true,
      blockTimestamp: true,
      blockHash: true,
    })
    .passthrough()
    .safeParse(prismaTx);

  if (!parsedPrismaTx.success) {
    return prismaTx;
  }

  const { maxFeePerBlobGas, blobGasUsed, blobAsCalldataGasUsed } =
    parsedPrismaTx.data;
  const {
    from: { rollup },
    fromId,
    toId,
    decodedFields,
    gasPrice,
    ...restTxFields
  } = parsedPrismaTx.data;
  const txFeeFields = blobGasPrice
    ? {
        blobGasMaxFee: maxFeePerBlobGas.mul(blobGasUsed),
        blobAsCalldataGasFee: gasPrice.mul(blobAsCalldataGasUsed),
        blobGasBaseFee: blobGasPrice.mul(blobGasUsed),
      }
    : undefined;

  return {
    category: rollup ? Category.ROLLUP : Category.OTHER,
    rollup,
    decodedFields: isEmptyObject(decodedFields) ? null : decodedFields,
    from: fromId,
    to: toId,
    ...restTxFields,
    ...txFeeFields,
  };
}

export const transactionSchema = fullPrismaTransactionSchema.transform(
  ({ blobs, ...prismaTx }) => ({
    ...transformPrismaTransaction(prismaTx, prismaTx.block.blobGasPrice),
    blobs: blobs.map((btx) => transformPrismaBlobOnTx(btx)),
  })
);

export const serializedTransactionSchema = transactionSchema.transform((tx) =>
  serialize(tx)
);
