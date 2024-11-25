import { prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { isBlockNumber } from "../../utils";
import { isAddress, isCommitment, isHash } from "./byTerm.utils";

type SearchCategory = "address" | "blob" | "block" | "slot" | "transaction";

type SearchOutput = {
  [K in SearchCategory]?: {
    id: string;
    label?: string;
    reorg?: boolean;
  }[];
};

export const byTerm = publicProcedure
  .input(
    z.object({
      term: z.string(),
    })
  )
  .query<SearchOutput>(async ({ input }) => searchByTerm(input.term));

export async function searchByTerm(term: string): Promise<SearchOutput> {
  if (isAddress(term)) {
    return {
      address: [{ id: term }],
    };
  }

  if (isCommitment(term)) {
    const blobResult = await prisma.blob.findUnique({
      select: { versionedHash: true },
      where: {
        commitment: term,
      },
    });

    if (blobResult) {
      return {
        blob: [{ id: blobResult.versionedHash }],
      };
    }
  }

  if (isHash(term)) {
    const [blobResult, txResult] = await Promise.all([
      prisma.blob.findUnique({
        select: { versionedHash: true },
        where: {
          versionedHash: term,
        },
      }),
      prisma.transaction.findUnique({
        select: { hash: true },
        where: {
          hash: term,
        },
      }),
    ]);

    if (blobResult) {
      return {
        blob: [{ id: blobResult.versionedHash }],
      };
    }

    if (txResult) {
      return {
        transaction: [{ id: txResult.hash }],
      };
    }
  }

  if (isBlockNumber(term)) {
    const blockNumber = Number(term);

    const blocks = await prisma.block.findMany({
      select: {
        number: true,
        transactionForks: true,
        hash: true,
      },
      where: {
        OR: [{ number: blockNumber }, { slot: blockNumber }],
      },
    });

    return blocks.reduce<SearchOutput>((output, block) => {
      const category: SearchCategory =
        block.number === blockNumber ? "block" : "slot";

      output[category] = [
        ...(output[category] || []),
        {
          id: block.hash,
          reorg: block.transactionForks.length > 0,
          label: block.number.toString(),
        },
      ];

      return output;
    }, {});
  }

  return {};
}
