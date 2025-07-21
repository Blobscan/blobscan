import { prisma } from "@blobscan/db";
import {
  AddressModel,
  BlobModel,
  BlockModel,
  TransactionModel,
} from "@blobscan/db/prisma/zod";
import {
  addressSchema,
  blobCommitmentOrProofSchema,
  blobVersionedHashSchema,
  blockNumberSchema,
  hashSchema,
} from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const outputSchema = z
  .object({
    address: AddressModel.pick({
      address: true,
      rollup: true,
    }).array(),
    blob: BlobModel.pick({
      versionedHash: true,
      commitment: true,
      proof: true,
    }).array(),
    transaction: TransactionModel.pick({
      hash: true,
      blockTimestamp: true,
    }).array(),
    block: BlockModel.pick({
      hash: true,
      number: true,
      slot: true,
      timestamp: true,
    })
      .merge(
        z
          .object({
            reorg: z.boolean(),
          })
          .partial()
      )
      .array(),
  })
  .partial();

export type OutputSchema = z.output<typeof outputSchema>;

export const byTerm = publicProcedure
  .input(
    z.object({
      term: z.string(),
    })
  )
  .output(outputSchema)
  .query(async ({ input }) => searchByTerm(input.term));

export async function searchByTerm(term: string): Promise<OutputSchema> {
  if (addressSchema.safeParse(term).success) {
    const dbAddress = await prisma.address.findUnique({
      select: {
        address: true,
        rollup: true,
      },
      where: {
        address: term,
      },
    });

    if (dbAddress) {
      return {
        address: [dbAddress],
      };
    }
  }

  if (blobCommitmentOrProofSchema.safeParse(term).success) {
    const blobResults = await prisma.blob.findMany({
      select: { versionedHash: true, commitment: true, proof: true },
      where: {
        OR: [
          { commitment: term },
          {
            proof: term,
          },
        ],
      },
    });

    if (blobResults.length) {
      return {
        blob: blobResults.map((r) => r),
      };
    }
  }

  if (blobVersionedHashSchema.safeParse(term).data) {
    const blob = await prisma.blob.findUnique({
      select: { versionedHash: true, commitment: true, proof: true },
      where: {
        versionedHash: term,
      },
    });

    if (blob) {
      return {
        blob: [blob],
      };
    }
  }

  if (hashSchema.safeParse(term).success) {
    const [blockResult, txResult] = await Promise.all([
      prisma.block.findUnique({
        select: { hash: true, timestamp: true, number: true, slot: true },
        where: {
          hash: term,
        },
      }),
      prisma.transaction.findUnique({
        select: { hash: true, blockTimestamp: true },
        where: {
          hash: term,
        },
      }),
    ]);

    if (blockResult) {
      return {
        block: [blockResult],
      };
    }

    if (txResult) {
      return {
        transaction: [txResult],
      };
    }
  }

  if (blockNumberSchema.safeParse(Number(term)).success) {
    const blockNumber = Number(term);

    const blocks = await prisma.block.findMany({
      select: {
        number: true,
        timestamp: true,
        transactionForks: true,
        slot: true,
        hash: true,
      },
      where: {
        OR: [{ number: blockNumber }, { slot: blockNumber }],
      },
    });

    if (blocks.length) {
      return {
        block: blocks.map((b) => ({
          ...b,
          reorg: b.transactionForks.length > 0,
        })),
      };
    }
  }

  return {};
}
