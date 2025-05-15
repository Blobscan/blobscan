import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient, Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
import { calculateTxFeeFields } from "../../../utils";
import type { Block } from "./selects";
import { createBlockSelect } from "./selects";

export type BlockId = "hash" | "number" | "slot";
export type BlockIdField =
  | { type: "hash"; value: string }
  | { type: "number"; value: number }
  | { type: "slot"; value: number };

function buildBlockWhereClause(
  { type, value }: BlockIdField,
  filters: Filters
): Prisma.BlockWhereInput {
  switch (type) {
    case "hash": {
      return { hash: value };
    }
    case "number": {
      return { number: value, transactionForks: filters.blockType };
    }
    case "slot": {
      return { slot: value, transactionForks: filters.blockType };
    }
  }
}

export async function fetchBlock(
  blockId: BlockIdField,
  {
    prisma,
    filters,
    expands,
  }: {
    blobStorageManager: BlobStorageManager;
    prisma: BlobscanPrismaClient;
    filters: Filters;
    expands: Expands;
  }
) {
  const where = buildBlockWhereClause(blockId, filters);

  const queriedBlock = (await prisma.block.findFirst({
    select: createBlockSelect(expands),
    where,
  })) as unknown as Block;

  if (!queriedBlock) {
    return;
  }

  const block = queriedBlock;

  if (expands.transaction) {
    block.transactions = block.transactions.map((tx) => {
      const { blobAsCalldataGasUsed, blobGasUsed, gasPrice, maxFeePerBlobGas } =
        tx;
      const feeFields =
        maxFeePerBlobGas && blobAsCalldataGasUsed && blobGasUsed && gasPrice
          ? calculateTxFeeFields({
              blobAsCalldataGasUsed,
              blobGasUsed,
              gasPrice,
              blobGasPrice: block.blobGasPrice,
              maxFeePerBlobGas,
            })
          : {};

      return {
        ...tx,
        ...feeFields,
      };
    });
  }

  return block;
}
