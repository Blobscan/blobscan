import { z } from "@blobscan/zod";

import {
  prismaBlobOnTransactionSchema,
  prismaBlockSchema,
  prismaTransactionSchema,
} from "../../../schemas";
import { serialize } from "../../../utils";
import { transformPrismaBlobOnTx } from "../../blob/common";
import { transformPrismaTransaction } from "../../tx/common";

export const fullPrismaBlockSchema = prismaBlockSchema.extend({
  transactions: z.array(
    prismaTransactionSchema
      .omit({
        blockHash: true,
        blockNumber: true,
        blockTimestamp: true,
      })
      .partial()
      .required({ hash: true })
      .extend({
        blobs: z.array(
          prismaBlobOnTransactionSchema.required({ blobHash: true })
        ),
      })
  ),
});

export const blockSchema = fullPrismaBlockSchema.transform(
  ({ transactions, ...restBlock }) => ({
    ...restBlock,
    transactions: transactions.map(({ blobs, ...prismaTx }) => ({
      ...transformPrismaTransaction(prismaTx, restBlock.blobGasPrice),
      blobs: blobs.map((btx) => transformPrismaBlobOnTx(btx)),
    })),
  })
);

export const serializedBlockSchema = blockSchema.transform(serialize);
