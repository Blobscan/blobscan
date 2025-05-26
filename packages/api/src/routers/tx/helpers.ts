import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedBlock,
  Expands,
} from "../../middlewares/withExpands";
import type { Prettify } from "../../types";
import {
  deriveTransactionFields,
  normalizePrismaBlobFields,
  normalizePrismaTransactionFields,
} from "../../utils/transformers";
import {
  baseTransactionSchema,
  baseBlobSchema,
  baseBlockSchema,
} from "../../zod-schemas";

const transactionSelect = {
  hash: true,
  fromId: true,
  toId: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  index: true,
  decodedFields: true,
  from: {
    select: {
      address: true,
      rollup: true,
    },
  },
} satisfies Prisma.TransactionSelect;

type PrismaTransaction = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

export type CompletePrismaTransaction = Prettify<
  PrismaTransaction & {
    decodedFields: NonNullable<PrismaTransaction["decodedFields"]>;
    block: Prettify<
      Partial<ExpandedBlock> & {
        blobGasPrice: ExpandedBlock["blobGasPrice"];
      }
    >;
    blobs: Prettify<
      { blobHash: string } & {
        blob?: ExpandedBlob;
      }
    >[];
  }
>;
export function createTransactionSelect(expands: Expands) {
  const blockExpand = expands.block?.select;
  const blobExpand = expands.blob;

  return {
    ...transactionSelect,
    block: {
      select: {
        ...(blockExpand ?? {}),
        blobGasPrice: true,
      },
    },
    blobs: {
      select: {
        blobHash: true,
        ...(blobExpand ? { blob: blobExpand } : {}),
      },
      orderBy: {
        index: "asc",
      },
    },
  } satisfies Prisma.TransactionSelect;
}

export const responseTransactionSchema = baseTransactionSchema.extend({
  block: baseBlockSchema
    .omit({
      hash: true,
      number: true,
      timestamp: true,
    })
    .partial()
    .required({
      blobGasPrice: true,
    }),
  blobs: z.array(baseBlobSchema.partial().required({ versionedHash: true })),
});

export type ResponseTransaction = z.input<typeof responseTransactionSchema>;

export function toResponseTransaction(
  prismaTx: CompletePrismaTransaction
): ResponseTransaction {
  const { blobs: blobsOnTxs, block } = prismaTx;
  const normalizedFields = normalizePrismaTransactionFields(prismaTx);
  const derivedFields = deriveTransactionFields({
    ...prismaTx,
    blobGasPrice: block.blobGasPrice,
  });
  const blobs = blobsOnTxs.map(({ blobHash, blob }) =>
    blob
      ? normalizePrismaBlobFields({ versionedHash: blobHash, ...blob })
      : { versionedHash: blobHash }
  );

  return {
    ...prismaTx,
    ...normalizedFields,
    ...derivedFields,
    blobs,
  };
}
