import type {
  BlobscanPrismaClient,
  EthUsdPrice,
  ExtendedBlockSelect,
  Prisma,
} from "@blobscan/db";
import { EthUsdPriceModel } from "@blobscan/db/prisma/zod";
import type { BlockIdField } from "@blobscan/db/prisma/zod-utils";
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
  normalizePrismaBlobDataStorageReferencesFields,
  normalizePrismaTransactionFields,
} from "../../utils";
import {
  baseBlobSchema,
  baseBlockSchema,
  baseTransactionSchema,
} from "../../zod-schemas";
import { extendedBlobDataStorageReferenceArgs } from "../blob/helpers";
import type { ExtendedBlobDataStorageReference } from "../blob/helpers";

const prismaBlockSelect = {
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasBaseFee: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
  computeUsdFields: true,
} satisfies ExtendedBlockSelect;

export type ExtendedPrismaBlock = NonNullable<
  Prisma.Result<
    BlobscanPrismaClient["block"],
    { select: typeof prismaBlockSelect },
    "findFirst"
  >
>;

export type CompletedPrismaBlock = Prettify<
  ExtendedPrismaBlock & {
    transactions: Prettify<
      {
        hash: string;
      } & Partial<ExpandedTransaction> & {
          blobs: Prettify<
            {
              blobHash: string;
            } & {
              blob: {
                dataStorageReferences: ExtendedBlobDataStorageReference[];
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
                dataStorageReferences: extendedBlobDataStorageReferenceArgs,
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
  ethUsdPrice: EthUsdPriceModel.shape.price.optional(),
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
  prismaBlock: CompletedPrismaBlock,
  ethUsdPrice?: EthUsdPrice["price"]
): ResponseBlock {
  const {
    transactions: blockTransactions,
    computeUsdFields,
    ...restBlock
  } = prismaBlock;
  const blockUsdFields = ethUsdPrice
    ? computeUsdFields(ethUsdPrice)
    : undefined;
  const blobGasPrice = prismaBlock.blobGasPrice;
  const responseBlock: ResponseBlock = {
    ...restBlock,
    ...(blockUsdFields ?? {}),
    ethUsdPrice: ethUsdPrice?.toNumber(),
    transactions: blockTransactions.map(
      ({ hash, blobs: blobsOnTxs, ...prismaTx }) => {
        let responseTransaction: ResponseBlock["transactions"][number] = {
          hash,
          blobs: blobsOnTxs.map(
            ({
              blobHash,
              blob: { dataStorageReferences, ...expandedBlob },
            }) => ({
              versionedHash: blobHash,
              dataStorageReferences:
                normalizePrismaBlobDataStorageReferencesFields(
                  dataStorageReferences
                ),
              ...expandedBlob,
            })
          ),
        };

        if (isFullyDefined(prismaTx)) {
          const {
            decodedFields,
            from,
            fromId,
            toId,
            computeFeeFields,
            computeUsdFields,
            ...restPrismaTx
          } = prismaTx;
          const normalizedFields = normalizePrismaTransactionFields({
            decodedFields,
            from,
            fromId,
            toId,
          });
          const txFeeFields = computeFeeFields(blobGasPrice);
          const txUsdFields = ethUsdPrice
            ? computeUsdFields({ ethUsdPrice, blobGasPrice })
            : undefined;

          responseTransaction = {
            ...responseTransaction,
            ...restPrismaTx,
            ...normalizedFields,
            ...txFeeFields,
            ...(txUsdFields ?? {}),
          };
        }

        return responseTransaction;
      }
    ),
  };

  return responseBlock;
}

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
    case "label": {
      return { transactionForks: filters.blockType };
    }
  }
}

function buildBlockOrderByClause({
  type,
  value,
}: BlockIdField): Prisma.BlockOrderByWithRelationInput | undefined {
  switch (type) {
    case "label": {
      return {
        number: value === "latest" ? "desc" : "asc",
      };
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
): Promise<
  | {
      block: CompletedPrismaBlock;
      ethUsdPrice?: EthUsdPrice;
    }
  | undefined
> {
  const select = createBlockSelect(expands);
  const where = buildBlockWhereClause(blockId, filters);
  const orderBy = buildBlockOrderByClause(blockId);

  const [prismaBlock, ethUsdPrice] = await Promise.all([
    prisma.block.findFirst({
      select,
      where,
      orderBy,
    }) as unknown as Promise<CompletedPrismaBlock | null>,
    prisma.block.findEthUsdPrice(blockId),
  ]);

  if (!prismaBlock) {
    return;
  }

  return {
    block: prismaBlock,
    ethUsdPrice,
  };
}
