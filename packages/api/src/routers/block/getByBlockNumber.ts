import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { fullBlockSelect } from "./common";
import {
  getByBlockNumberInputSchema,
  getByBlockNumberOutputSchema,
} from "./getByBlockNumber.schema";

export const getByBlockNumber = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{number}`,
      tags: ["blocks"],
      summary: "Get blocks time series stats",
    },
  })
  .input(getByBlockNumberInputSchema)
  .output(getByBlockNumberOutputSchema)
  .query(async ({ ctx, input: { number } }) => {
    const block = await ctx.prisma.block
      .findUnique({
        select: fullBlockSelect,
        where: {
          number,
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
