import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { fullBlockSelect } from "./common";
import { getByHashInputSchema } from "./getByHash.schema";

export const getByHash = publicProcedure
  .input(getByHashInputSchema)
  .query(async ({ ctx, input }) => {
    const { hash } = input;

    const block = await ctx.prisma.block.findUnique({
      select: fullBlockSelect,
      where: {
        hash,
      },
    });

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No block with hash '${hash}'`,
      });
    }

    return block;
  });
