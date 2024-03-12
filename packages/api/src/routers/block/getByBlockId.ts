import { TRPCError } from "@trpc/server";

import { Prisma } from "@blobscan/db";

import { publicProcedure } from "../../procedures";
import { formatFullBlockForApi, fullBlockSelect } from "./common";
import {
  getByBlockIdOutputSchema,
  getByBlockIdSchema,
} from "./getByBlockId.schema";

export const getByBlockId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{id}`,
      tags: ["blocks"],
      summary: "retrieves block details for given block number, slot or hash.",
    },
  })
  .input(getByBlockIdSchema)
  .output(getByBlockIdOutputSchema)
  .query(async ({ ctx, input: { id, reorg } }) => {
    const isIdNumeric = typeof id === "number";
    const idWhereFilters: Prisma.BlockWhereInput[] = isIdNumeric
      ? [{ number: id }]
      : [{ hash: id }];

    const block = await ctx.prisma.block
      .findFirst({
        select: fullBlockSelect,
        where: {
          OR: idWhereFilters,
          transactionForks: {
            ...(reorg ? { some: {} } : { none: {} }),
          },
        },
      })
      .then((block) => (block ? formatFullBlockForApi(block) : null));

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No block with id '${id}'.`,
      });
    }

    return block;
  });
