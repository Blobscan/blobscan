import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient, Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
import { calculateTxFeeFields, retrieveBlobData } from "../../../utils";
import { createBlockSelect } from "./selects";
import type { Block } from "./serializers";

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

  if (expands.blobData) {
    const txsBlobs = block.transactions.flatMap((tx) => tx.blobs);

    await Promise.all(
      txsBlobs.map(async ({ blobHash, blob }) => {
        const dataStorageReferences = blob?.dataStorageReferences;
        if (dataStorageReferences) {
          const data = await retrieveBlobData(blobStorageManager, {
            dataStorageReferences,
            versionedHash: blobHash,
          });

          blob.data = data;
        }
      })
    );
  }

  return block;
}
