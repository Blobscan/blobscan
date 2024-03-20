import type {
  Blob as DBBlob,
  Block as DBBlock,
  Transaction as DBTransaction,
} from "@blobscan/db";
import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { ZodRollupEnum, rollupSchema } from "../../utils";

type RawTransaction = Pick<
  DBTransaction,
  | "hash"
  | "fromId"
  | "toId"
  | "blockHash"
  | "blobAsCalldataGasUsed"
  | "gasPrice"
  | "maxFeePerBlobGas"
  | "rollup"
> & {
  block: Pick<DBBlock, "number" | "timestamp" | "slot" | "blobGasPrice">;
  blobs: {
    index: number;
    blob: Pick<DBBlob, "versionedHash" | "size">;
  }[];
};

type FullTransaction = Pick<
  DBTransaction,
  | "hash"
  | "fromId"
  | "toId"
  | "blockHash"
  | "blobAsCalldataGasUsed"
  | "gasPrice"
  | "maxFeePerBlobGas"
  | "rollup"
> & {
  block: Pick<
    DBBlock,
    "number" | "timestamp" | "excessBlobGas" | "blobGasPrice"
  >;
  blobs: {
    blobHash: string;
    index: number;
    blob: Pick<DBBlob, "commitment" | "proof" | "size">;
  }[];
};

const GAS_PER_BLOB = 2 ** 17; // 131_072

export const serializedTransactionSchema = z.object({
  blockNumber: z.number(),
  blockHash: z.string(),
  timestamp: z.string(),
  from: z.string(),
  to: z.string(),
  hash: z.string(),
  blobGasPrice: z.string(),
  blobGasBaseFee: z.string(),
  blobGasMaxFee: z.string(),
  blobGasUsed: z.string(),
  maxFeePerBlobGas: z.string(),
  blobAsCalldataGasUsed: z.string(),
  totalBlobSize: z.number(),
  rollup: rollupSchema.nullable(),
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
    })
  ),
});

export type SerializedTransaction = z.infer<typeof serializedTransactionSchema>;

const baseTransactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  hash: true,
  fromId: true,
  toId: true,
  blobAsCalldataGasUsed: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  rollup: true,
  blockHash: true,
});

export const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  ...baseTransactionSelect,
  block: {
    select: {
      number: true,
      timestamp: true,
      slot: true,
      blobGasPrice: true,
    },
  },
  blobs: {
    select: {
      index: true,
      blob: {
        select: {
          versionedHash: true,
          size: true,
        },
      },
    },
  },
});

export const fullTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    ...baseTransactionSelect,
    block: {
      select: {
        number: true,
        timestamp: true,
        blobGasPrice: true,
        excessBlobGas: true,
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

function buildDerivedFields(tx: RawTransaction): {
  blobGasUsed: Prisma.Decimal;
  blobGasBaseFee: Prisma.Decimal;
  blobGasMaxFee: Prisma.Decimal;
  totalBlobSize: number;
} {
  const blobGasUsed = new Prisma.Decimal(tx.blobs.length).mul(GAS_PER_BLOB);
  const blobGasBaseFee = tx.block.blobGasPrice.mul(blobGasUsed);
  const blobGasMaxFee = tx.maxFeePerBlobGas.mul(blobGasUsed);
  const totalBlobSize = tx.blobs.reduce(
    (acc, { blob: { size } }) => acc + size,
    0
  );

  return {
    blobGasBaseFee,
    blobGasMaxFee,
    blobGasUsed,
    totalBlobSize,
  };
}

export function serializeTransaction(
  rawTx: RawTransaction
): SerializedTransaction {
  const { blobs, block, rollup } = rawTx;
  const sortedBlobs = blobs
    .sort((a, b) => a.index - b.index)
    .map((b) => ({
      versionedHash: b.blob.versionedHash,
    }));
  const { blobGasBaseFee, blobGasMaxFee, blobGasUsed, totalBlobSize } =
    buildDerivedFields(rawTx);

  return {
    hash: rawTx.hash,
    from: rawTx.fromId,
    to: rawTx.toId,
    timestamp: block.timestamp.toISOString(),
    blobGasPrice: rawTx.block.blobGasPrice.toFixed(),
    blobAsCalldataGasUsed: rawTx.blobAsCalldataGasUsed.toFixed(),
    maxFeePerBlobGas: rawTx.maxFeePerBlobGas.toFixed(),
    blobGasBaseFee: blobGasBaseFee.toFixed(),
    blobGasMaxFee: blobGasMaxFee.toFixed(),
    blobGasUsed: blobGasUsed.toFixed(),
    totalBlobSize: totalBlobSize,
    rollup: rollup ? (rollup.toLowerCase() as ZodRollupEnum) : null,
    blockNumber: block.number,
    blockHash: rawTx.blockHash,
    blobs: sortedBlobs,
  };
}

function formatCommonFields(tx: FullTransaction) {
  const blobGasUsed = BigInt(tx.blobs.length) * BigInt(GAS_PER_BLOB);
  const blobGasBaseFee = BigInt(tx.block.blobGasPrice.toFixed()) * blobGasUsed;
  const blobGasMaxFee = BigInt(tx.maxFeePerBlobGas.toFixed()) * blobGasUsed;

  return {
    blobGasUsed: blobGasUsed.toString(),
    blobGasBaseFee: blobGasBaseFee.toString(),
    blobGasMaxFee: blobGasMaxFee.toString(),
    blobAsCalldataGasUsed: tx.blobAsCalldataGasUsed.toFixed(),
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

export function formatFullTransactionForApi(
  tx: FullTransaction
): SerializedTransaction {
  const commonFields = formatCommonFields(tx);

  return {
    ...commonFields,
    blockHash: tx.blockHash,
    blockNumber: tx.block.number,
    timestamp: tx.block.timestamp.toISOString(),
    from: tx.fromId,
    to: tx.toId,
    hash: tx.hash,
    rollup: tx.rollup ? (tx.rollup.toLowerCase() as ZodRollupEnum) : null,
    blobGasPrice: tx.block.blobGasPrice.toFixed(),
    blobs: tx.blobs.map((b) => {
      return {
        versionedHash: b.blobHash,
      };
    }),
  };
}
