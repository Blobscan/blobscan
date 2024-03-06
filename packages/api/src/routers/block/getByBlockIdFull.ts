import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { isBlockNumber } from "../utils";
import { formatFullBlock, fullBlockSelect } from "./common";
import { getByBlockIdSchema } from "./getByBlockId.schema";

export const getByBlockIdFull = publicProcedure
  .input(getByBlockIdSchema)
  .query(async ({ ctx, input: { id, reorg } }) => {
    const numericId = isBlockNumber(id) ? Number(id) : undefined;

    const block = await ctx.prisma.block
      .findFirst({
        select: fullBlockSelect,
        where: {
          OR: [{ number: numericId }, { slot: numericId }, { hash: id }],
          transactionForks: {
            ...(reorg ? { some: {} } : { none: {} }),
          },
        },
      })
      .then((block) => (block ? formatFullBlock(block) : null));

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No block with number, slot or hash '${id}'.`,
      });
    }

    return block;
  });
