import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { formatFullTransaction, fullTransactionSelect } from "./common";
import { getByHashInputSchema } from "./getByHash.schema";

export const getByHash = publicProcedure
  .input(getByHashInputSchema)
  .query(async ({ ctx, input: { hash } }) => {
    const tx = await ctx.prisma.transaction
      .findUnique({
        select: fullTransactionSelect,
        where: { hash },
      })
      .then((tx) => (tx ? formatFullTransaction(tx) : null));

    if (!tx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No tx with hash '${hash}'`,
      });
    }

    return tx;
  });
