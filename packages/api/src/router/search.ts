import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  isAddress,
  isBlockNumber,
  isCommitment,
  isHash,
} from "../utils/search";

type HashResponse = {
  entity: string;
  hash: string;
  index?: number;
  txHash?: string;
};

type SearchCategory = "address" | "blob" | "block" | "slot" | "transaction";

type SearchOutput = {
  [K in SearchCategory]?: { id: string }[];
};

function entityToCategory(entity: string): SearchCategory {
  switch (entity) {
    case "Blob":
      return "blob";
    case "Block":
      return "block";
    case "Slot":
      return "slot";
    case "Transaction":
      return "transaction";
    default:
      throw new Error(`Unknown entity ${entity}`);
  }
}

export const searchRouter = createTRPCRouter({
  byTerm: publicProcedure
    .input(
      z.object({
        term: z.string(),
      }),
    )
    .query<SearchOutput>(async ({ ctx, input }) => {
      const { term } = input;

      if (isAddress(term)) {
        return {
          address: [{ id: term }],
        };
      }

      if (isCommitment(term)) {
        const blobs = await ctx.prisma.blobsOnTransactions.findMany({
          select: { index: true, txHash: true },
          where: {
            blob: {
              commitment: term,
            },
          },
        });

        return {
          blob: blobs.map((blob) => ({
            id: `${blob.txHash}-${blob.index}`,
          })),
        };
      }

      if (isHash(term)) {
        const response = await ctx.prisma.$queryRaw<HashResponse[]>`
          SELECT
            'Blob' AS entity,
            "versionedHash" AS hash,
            "index",
            "txHash"
          FROM
            "Blob"
          WHERE
            "versionedHash" = ${term}
            
          UNION

          SELECT
            'Transaction' AS entity,
            "hash" AS hash,
            NULL AS index,
            NULL AS txHash
          FROM
            "Transaction" "t"
          WHERE
            "hash" = ${term}
        `;

        return response.reduce<SearchOutput>((output, el) => {
          const category = entityToCategory(el.entity);
          const id =
            el.txHash && el.index !== undefined
              ? `${el.txHash}-${el.index}`
              : el.hash;
          const searchElement = { id };

          output[category] = [...(output[category] || []), searchElement];

          return output;
        }, {});
      }

      if (isBlockNumber(term)) {
        const term_ = Number(term);

        const blocks = await ctx.prisma.block.findMany({
          select: { number: true },
          where: {
            OR: [{ number: term_ }, { slot: term_ }],
          },
        });

        return blocks.reduce<SearchOutput>((output, block) => {
          const category: SearchCategory =
            block.number === term_ ? "block" : "slot";
          output[category] = [
            ...(output[category] || []),
            { id: block.number.toString() },
          ];

          return output;
        }, {});
      }

      return {};
    }),
});
