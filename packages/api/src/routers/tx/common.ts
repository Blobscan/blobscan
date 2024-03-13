import type { Blob, Block, Transaction } from "@blobscan/db";
import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { GAS_PER_BLOB } from "../utils";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  hash: true,
  fromId: true,
  toId: true,
  blockHash: true,
  blobGasAsCalldataUsed: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
});

type FullTransaction = Pick<
  Transaction,
  | "hash"
  | "fromId"
  | "toId"
  | "blockHash"
  | "blobGasAsCalldataUsed"
  | "gasPrice"
  | "maxFeePerBlobGas"
> & {
  block: Pick<Block, "number" | "timestamp" | "excessBlobGas" | "blobGasPrice">;
  blobs: {
    blobHash: string;
    index: number;
    blob: Pick<Blob, "commitment" | "proof" | "size">;
  }[];
};

export const fullTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    ...transactionSelect,
    block: {
      select: {
        number: true,
        excessBlobGas: true,
        timestamp: true,
        blobGasPrice: true,
      },
    },
    blobs: {
      select: {
        blobHash: true,
        index: true,
        blob: {
          select: {
            commitment: true,
            proof: true,
            size: true,
          },
        },
      },
    },
  });

function formatCommonFields(tx: FullTransaction) {
  const blobGasUsed = BigInt(tx.blobs.length) * BigInt(GAS_PER_BLOB);
  const blobGasBaseFee = BigInt(tx.block.blobGasPrice.toFixed()) * blobGasUsed;
  const blobGasMaxFee = BigInt(tx.maxFeePerBlobGas.toFixed()) * blobGasUsed;

  return {
    blobGasUsed: blobGasUsed.toString(),
    blobGasBaseFee: blobGasBaseFee.toString(),
    blobGasMaxFee: blobGasMaxFee.toString(),
    blobGasAsCalldataUsed: tx.blobGasAsCalldataUsed.toFixed(),
    maxFeePerBlobGas: tx.maxFeePerBlobGas.toFixed(),
    gasPrice: tx.gasPrice.toFixed(),
    totalBlobSize: tx.blobs.reduce((acc, { blob }) => acc + blob.size, 0),
  };
}

export function formatFullTransaction(tx: FullTransaction) {
  const commonFields = formatCommonFields(tx);

  return {
    ...tx,
    ...commonFields,
    block: {
      ...tx.block,
      timestamp: Math.floor(tx.block.timestamp.getTime() / 1000),
      blobGasPrice: tx.block.blobGasPrice.toFixed(),
      excessBlobGas: tx.block.excessBlobGas.toFixed(),
    },
  };
}

export function formatFullTransactionForApi(tx: FullTransaction) {
  const commonFields = formatCommonFields(tx);

  return {
    ...commonFields,
    blockHash: tx.blockHash,
    blockNumber: tx.block.number,
    from: tx.fromId,
    to: tx.toId,
    hash: tx.hash,
    blobGasPrice: tx.block.blobGasPrice.toFixed(),
    blobs: tx.blobs.map((b) => b.blobHash),
  };
}

export const TransactionSchema = z.object({
  blockHash: z.string(),
  blockNumber: z.number(),
  from: z.string(),
  to: z.string(),
  hash: z.string(),
  gasPrice: z.string(),
  blobGasPrice: z.string(),
  blobGasBaseFee: z.string(),
  blobGasMaxFee: z.string(),
  blobGasUsed: z.string(),
  maxFeePerBlobGas: z.string(),
  blobGasAsCalldataUsed: z.string(),
  totalBlobSize: z.number(),
  blobs: z.array(z.string()),
});
