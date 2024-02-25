import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { fullBlockSelect, getBlockOutputSchema } from "./common";
import { getByBlockNumberInputSchema } from "./getByBlockNumber.schema";

export const getByBlockNumber = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{number}`,
      tags: ["blocks"],
      summary: "get block info",
    },
  })
  .input(getByBlockNumberInputSchema)
  .output(getBlockOutputSchema)
  .query(async ({ ctx, input: { number, reorg } }) => {
    const block = await ctx.prisma.block
      .findFirst({
        select: fullBlockSelect,
        where: {
          number,
          transactionForks: {
            ...(reorg ? { some: {} } : { none: {} }),
          },
        },
      })
      .then((block) =>
        block
          ? {
              ...block,
              blobAsCalldataGasUsed: block.blobAsCalldataGasUsed.toFixed(),
              blobGasUsed: block.blobGasUsed.toFixed(),
              excessBlobGas: block.excessBlobGas.toFixed(),
              blobGasPrice: block.blobGasPrice.toFixed(),
            }
          : null
      );

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No block with number '${number}'`,
      });
    }

    return block;
  });
