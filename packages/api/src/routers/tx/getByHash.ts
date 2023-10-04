import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { fullTransactionSelect } from "./common";
import { getByHashInputSchema } from "./getByHash.schema";

export const getByHash = publicProcedure
  .input(getByHashInputSchema)
  .query(async ({ ctx, input }) => {
    const { hash } = input;
    const tx = await ctx.prisma.transaction.findUnique({
      select: fullTransactionSelect,
      where: { hash },
    });
    if (!tx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No tx with hash '${hash}'`,
      });
    }

    return tx;
  });
