import type { BlobscanPrismaClient, Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type {
  ExpandedBlob,
  ExpandedTransaction,
  Expands,
} from "../../middlewares/withExpands";
import type { Filters } from "../../middlewares/withFilters";
import type { Prettify } from "../../types";
import { isFullyDefined } from "../../utils";
import {
  deriveTransactionFields,
  normalizeDataStorageReferences,
  normalizePrismaBlobFields,
  normalizePrismaTransactionFields,
} from "../../utils/transformers";
import {
  baseBlobSchema,
  baseBlockSchema,
  baseTransactionSchema,
} from "../../zod-schemas";

const prismaBlockSelect = {
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
} satisfies Prisma.BlockSelect;

const dataStorageReferenceSelect = {
  blobStorage: true,
  dataReference: true,
} satisfies Prisma.BlobDataStorageReferenceSelect;

type DataStorageReference = Prisma.BlobDataStorageReferenceGetPayload<{
  select: typeof dataStorageReferenceSelect;
}>;

export type PrismaBlock = Prisma.BlockGetPayload<{
  select: typeof prismaBlockSelect;
}>;

export type CompletePrismaBlock = Prettify<
  PrismaBlock & {
    transactions: Prettify<
      {
        hash: string;
      } & Partial<ExpandedTransaction> & {
          blobs: Prettify<
            {
              blobHash: string;
            } & {
              blob: {
                dataStorageReferences: DataStorageReference[];
              } & Partial<ExpandedBlob>;
            }
          >[];
        }
    >[];
  }
>;

export function createBlockSelect(expands: Expands, filters?: Filters) {
  const blobExpand = expands.blob?.select;
  const transactionExpand = expands.transaction?.select ?? {};

  return {
    ...prismaBlockSelect,
    transactions: {
      select: {
        hash: true,
        ...transactionExpand,
        blobs: {
          select: {
            blobHash: true,
            blob: {
              select: {
                dataStorageReferences: {
                  select: {
                    blobStorage: true,
                    dataReference: true,
                  },
                  orderBy: {
                    blobStorage: "asc",
                  },
                },
                ...(blobExpand ?? {}),
              },
            },
          },
          orderBy: {
            index: "asc",
          },
        },
      },
      orderBy: {
        index: "asc",
      },
      where: filters?.transactionFilters,
    },
  } satisfies Prisma.BlockSelect;
}

export const responseBlockSchema = baseBlockSchema.extend({
  transactions: z.array(
    baseTransactionSchema
      .omit({
        blockHash: true,
        blockNumber: true,
        blockTimestamp: true,
      })
      .partial()
      .required({ hash: true })
      .extend({
        blobs: z.array(
          baseBlobSchema.partial().required({ versionedHash: true })
        ),
      })
  ),
});

export type ResponseBlock = z.input<typeof responseBlockSchema>;

export function toResponseBlock(
  prismaBlock: CompletePrismaBlock
): ResponseBlock {
  const transactions = prismaBlock.transactions.map(
    ({ hash, blobs, ...prismaTx }) => ({
      hash,
      ...(isFullyDefined(prismaTx)
        ? {
            ...prismaTx,
            ...normalizePrismaTransactionFields(prismaTx),
            ...deriveTransactionFields({
              ...prismaTx,
              blobGasPrice: prismaBlock.blobGasPrice,
            }),
          }
        : {}),
      blobs: blobs.map(
        ({ blobHash, blob: { dataStorageReferences, ...expandedBlob } }) =>
          Object.keys(expandedBlob)
            ? normalizePrismaBlobFields({
                versionedHash: blobHash,
                dataStorageReferences,
                ...(expandedBlob as Required<typeof expandedBlob>),
              })
            : {
                versionedHash: blobHash,
                dataStorageReferences: normalizeDataStorageReferences(
                  dataStorageReferences
                ),
              }
      ),
    })
  );

  return {
    ...prismaBlock,
    transactions,
  };
}

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

  return prismaBlock;
}
