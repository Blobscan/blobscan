import type { Blob, Block, Transaction } from "@blobscan/db";
import { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

export const blockIdSchema = z
  .string()
  .refine(
    (s) => {
      if (s.startsWith("0x") && s.length === 66) {
        return s;
      }
    },
    {
      message: "Invalid block id",
    }
  )
  .or(z.coerce.number().positive());

export type BlockId = z.infer<typeof blockIdSchema>;

const blockSelect = Prisma.validator<Prisma.BlockSelect>()({
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobGasAsCalldataUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
});

export const fullBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  ...blockSelect,
  transactions: {
    select: {
      hash: true,
      fromId: true,
      toId: true,
      blobs: {
        select: {
          blobHash: true,
          index: true,
          blob: {
            select: {
              size: true,
            },
          },
        },
      },
    },
  },
});

type TransactionSelection = Pick<Transaction, "hash" | "fromId" | "toId"> & {
  blobs: {
    blobHash: string;
    index: number;
    blob: Pick<Blob, "size">;
  }[];
};

export type FullBlock = Pick<
  Block,
  | "number"
  | "hash"
  | "slot"
  | "timestamp"
  | "blobGasPrice"
  | "excessBlobGas"
  | "blobGasUsed"
  | "blobGasAsCalldataUsed"
> & {
  transactions: TransactionSelection[];
};

export function formatFullBlock(block: FullBlock) {
  return {
    ...block,
    timestamp: Math.floor(block.timestamp.getTime() / 1000),
    totalBlobSize:
      block.transactions.reduce(
        (acc, tx) =>
          acc + tx.blobs.reduce((acc, { blob }) => acc + blob.size, 0),
        0
      ) ?? 0,
    blobGasPrice: block.blobGasPrice.toFixed(),
    blobGasUsed: block.blobGasUsed.toFixed(),
    excessBlobGas: block.excessBlobGas.toFixed(),
    blobGasAsCalldataUsed: block.blobGasAsCalldataUsed.toFixed(),
  };
}

export function formatFullBlockForApi(block: FullBlock) {
  const formatedFullBlock = formatFullBlock(block);

  return {
    ...formatedFullBlock,
    transactions: block.transactions.map((t) => t.hash),
    blobs: block.transactions.flatMap((t) => t.blobs.map((b) => b.blobHash)),
  };
}

export const BlockSchema = z.object({
  hash: z.string(),
  number: z.number(),
  slot: z.number(),
  excessBlobGas: z.string(),
  blobGasPrice: z.string(),
  blobGasUsed: z.string(),
  blobGasAsCalldataUsed: z.string(), // TODO: rename to blobGasAsCalldata
  totalBlobSize: z.number(),
  timestamp: z.date().or(z.number()),
  transactions: z.array(z.string()),
  blobs: z.array(z.string()),
});
