import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { formatFullTransactionForApi, fullTransactionSelect } from "./common";
import {
  getByHashInputSchema,
  getByHashOutputSchema,
} from "./getByHash.schema";

export const getByHash = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/transactions/{hash}",
      tags: ["transactions"],
      summary: "retrieves transaction details for given transaction hash.",
    },
  })
  .input(getByHashInputSchema)
  .output(getByHashOutputSchema)
  .query(async ({ ctx, input: { hash } }) => {
    const tx = await ctx.prisma.transaction
      .findUnique({
        select: fullTransactionSelect,
        where: { hash },
      })
      .then((tx) => (tx ? formatFullTransactionForApi(tx) : null));

    if (!tx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No transaction with hash '${hash}'.`,
      });
    }

    return tx;
  });
