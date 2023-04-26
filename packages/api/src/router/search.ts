import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { isAddress, isCommitment, isHash, isNumber } from "../utils";

type HashResponse = {
  entity: string;
  hash: string;
  index?: number;
  txHash?: string;
};

export const searchRouter = createTRPCRouter({
  byTerm: publicProcedure
    .input(
      z.object({
        term: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { term } = input;

      if (isAddress(term)) {
        return [
          {
            title: "Address",
            path: `/address/${term}`,
            value: term,
          },
        ];
      }

      if (isCommitment(term)) {
        const blobs = await ctx.prisma.blob.findMany({
          select: { index: true, txHash: true },
          where: {
            commitment: term,
          },
        });

        return blobs.map((blob) => ({
          title: "Blob",
          path: `/tx/${blob.txHash}/blob/${blob.index}`,
          value: term,
        }));
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

        return response.map((e) => {
          return {
            title: e.entity,
            path:
              e.entity === "Transaction"
                ? `/tx/${e.hash}`
                : `/tx/${e.txHash}/blob/${e.index}`,
            value: term,
          };
        });
      }

      if (isNumber(term)) {
        const blocks = await ctx.prisma.block.findMany({
          select: { number: true },
          where: {
            OR: [{ number: Number(term) }, { slot: Number(term) }],
          },
        });

        return blocks.map((block) => ({
          title: block.number === Number(term) ? "Block" : "Slot",
          path: `/block/${block.number}`,
          value: term,
        }));
      }

      return [];
    }),
});
