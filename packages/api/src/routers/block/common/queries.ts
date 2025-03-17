import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient, Prisma } from "@blobscan/db";

import type { Expands } from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
import { retrieveBlobData } from "../../../utils";
import type { CompletePrismaBlock } from "./selects";
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
): Promise<CompletePrismaBlock | undefined> {
  const select = createBlockSelect(expands);
  const where = buildBlockWhereClause(blockId, filters);

  const prismaBlock = (await prisma.block.findFirst({
    select,
    where,
  })) as unknown as CompletePrismaBlock | null;

  if (!prismaBlock) {
    return;
  }

  if (expands.blobData) {
    await Promise.all(
      prismaBlock.transactions
        .flatMap((tx) => tx.blobs)
        .map(async ({ blobHash, blob }) => {
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

  return prismaBlock;
}
