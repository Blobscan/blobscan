import { TRPCError } from "@trpc/server";

import { Prisma } from "@blobscan/db";

import { publicProcedure } from "../../procedures";
import { formatFullBlock, fullBlockSelect } from "./common";
import { getByBlockIdSchema } from "./getByBlockId.schema";

export const getByBlockIdFull = publicProcedure
  .input(getByBlockIdSchema)
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
      .then((block) => (block ? formatFullBlock(block) : null));

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No block with id '${id}'.`,
      });
    }

    return block;
  });
