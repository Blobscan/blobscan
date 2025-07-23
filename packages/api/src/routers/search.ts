import type { Prisma } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import {
  AddressModel,
  BlobModel,
  BlobsOnTransactionsModel,
  BlockModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import {
  addressSchema,
  blobCommitmentSchema,
  blobProofSchema,
  blobVersionedHashSchema,
  blockNumberSchema,
  hashSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../procedures";

const addressSearchResultSchema = AddressModel.pick({
  address: true,
  rollup: true,
});

const blobSearchResultSchema = BlobModel.pick({
  versionedHash: true,
  commitment: true,
  proof: true,
}).extend({
  transactions: BlobsOnTransactionsModel.pick({
    blockTimestamp: true,
  })
    .extend({
      transaction: z.object({
        from: AddressModel.pick({ rollup: true }).optional(),
      }),
    })
    .array(),
});

const blockSearchResultSchema = BlockModel.pick({
  hash: true,
  number: true,
  slot: true,
  timestamp: true,
}).extend({
  reorg: z.boolean().optional(),
});

const transactionSearchResultSchema = TransactionModel.pick({
  hash: true,
  blockTimestamp: true,
}).extend({
  from: AddressModel.pick({ rollup: true }),
});

const searchResultsSchema = z
  .object({
    addresses: addressSearchResultSchema.array(),
    blobs: blobSearchResultSchema.array(),
    blocks: blockSearchResultSchema.array(),
    transactions: transactionSearchResultSchema.array(),
  })
  .partial();

const blockSelect = {
  number: true,
  timestamp: true,
  transactionForks: true,
  slot: true,
  hash: true,
} satisfies Prisma.BlockSelect;

const transactionSelect = {
  hash: true,
  blockTimestamp: true,
  from: {
    select: {
      rollup: true,
    },
  },
} satisfies Prisma.TransactionSelect;

type BlockPayload = Prisma.BlockGetPayload<{ select: typeof blockSelect }>;

type TransactionPayload = Prisma.TransactionGetPayload<{
  select: typeof transactionSelect;
}>;

const outputSchema = searchResultsSchema.nullable();

export type OutputSchema = z.output<typeof outputSchema>;

export const search = publicProcedure
  .input(
    z.object({
      query: z.string(),
    })
  )
  .query(async ({ input: { query } }) => {
    const isAddress = addressSchema.safeParse(query).success;
    if (isAddress) {
      const dbAddress = await prisma.address.findUnique({
        select: {
          address: true,
          rollup: true,
        },
        where: {
          address: query,
        },
      });

      if (dbAddress) {
        return {
          addresses: [dbAddress],
        };
      }
    }

    const isCommitment = blobCommitmentSchema.safeParse(query).success;
    const isProof = blobProofSchema.safeParse(query).success;
    const isVersionedHash = blobVersionedHashSchema.safeParse(query).success;
    const isBlob = isCommitment || isProof || isVersionedHash;

    if (isBlob) {
      const where: Prisma.BlobWhereInput = isVersionedHash
        ? {
            versionedHash: query,
          }
        : {
            OR: [{ commitment: query }, { proof: query }],
          };
      const dbBlocks = await prisma.blob.findMany({
        select: {
          versionedHash: true,
          commitment: true,
          proof: true,
          transactions: {
            select: {
              transaction: {
                select: {
                  from: {
                    select: {
                      rollup: true,
                    },
                  },
                },
              },
              blockTimestamp: true,
            },
            take: 1,
            orderBy: {
              blockNumber: "desc",
            },
          },
        },
        where,
      });

      if (dbBlocks.length) {
        return {
          blobs: dbBlocks.map((r) => r),
        };
      }
    }

    const isHash = hashSchema.safeParse(query).success;
    const isBlockNumber =
      !query.startsWith("0x") && blockNumberSchema.safeParse(query).success;

    if (isBlockNumber || isHash) {
      const ops: [
        Promise<BlockPayload[]>?,
        Promise<TransactionPayload | null>?
      ] = [];

      if (isBlockNumber || isHash) {
        const where: Prisma.BlockWhereInput = isBlockNumber
          ? {
              OR: [{ number: Number(query) }, { slot: Number(query) }],
            }
          : {
              hash: query,
            };

        ops.push(
          prisma.block.findMany({
            select: blockSelect,
            where,
          })
        );

        if (isHash) {
          ops.push(
            prisma.transaction.findUnique({
              select: transactionSelect,
              where: {
                hash: query,
              },
            })
          );
        }
      }

      const [dbBlocks, dbTx] = await Promise.all(ops);

      if (dbBlocks?.length) {
        return {
          blocks: dbBlocks,
        };
      }

      if (dbTx) {
        return {
          transactions: [dbTx],
        };
      }
    }

    return null;
  });
