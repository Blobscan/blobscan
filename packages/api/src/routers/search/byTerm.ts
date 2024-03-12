import { publicProcedure } from "../../procedures";
import { isBlockNumber } from "../../utils";
import { byTermInputSchema } from "./byTerm.schema";
import { isAddress, isCommitment, isHash } from "./byTerm.utils";

type SearchCategory = "address" | "blob" | "block" | "slot" | "transaction";

type SearchOutput = {
  [K in SearchCategory]?: { id: string }[];
};

export const byTerm = publicProcedure
  .input(byTermInputSchema)
  .query<SearchOutput>(async ({ ctx, input }) => {
    const { term } = input;

    if (isAddress(term)) {
      return {
        address: [{ id: term }],
      };
    }

    if (isCommitment(term)) {
      const blobResult = await ctx.prisma.blob.findUnique({
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
        ctx.prisma.blob.findUnique({
          select: { versionedHash: true },
          where: {
            versionedHash: term,
          },
        }),
        ctx.prisma.transaction.findUnique({
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
  });
