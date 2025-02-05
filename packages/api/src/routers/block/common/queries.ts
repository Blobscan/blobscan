import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient, Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
import {
  calculateDerivedTxBlobGasFields,
  retrieveBlobData,
} from "../../../utils";
import { createBlockSelect } from "./selects";
import type { QueriedBlock } from "./serializers";

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
    blobStorageManager,
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

  const queriedBlock = await prisma.block.findFirst({
    select: createBlockSelect(expands),
    where,
  });

  if (!queriedBlock) {
    return;
  }

  const block: QueriedBlock = queriedBlock;

  if (expands.transaction) {
    block.transactions = block.transactions.map((tx) => {
      const { blobAsCalldataGasUsed, blobGasUsed, gasPrice, maxFeePerBlobGas } =
        tx;
      const derivedFields =
        maxFeePerBlobGas && blobAsCalldataGasUsed && blobGasUsed && gasPrice
          ? calculateDerivedTxBlobGasFields({
              blobAsCalldataGasUsed,
              blobGasUsed,
              gasPrice,
              blobGasPrice: block.blobGasPrice,
              maxFeePerBlobGas,
            })
          : {};

      return {
        ...tx,
        ...derivedFields,
      };
    });
  }

  if (expands.blobData) {
    const txsBlobs = block.transactions.flatMap((tx) => tx.blobs);

    await Promise.all(
      txsBlobs.map(async ({ blob }) => {
        if (blob.dataStorageReferences?.length) {
          const data = await retrieveBlobData(blobStorageManager, blob);

          blob.data = data;
        }
      })
    );
  }

  return block;
}
