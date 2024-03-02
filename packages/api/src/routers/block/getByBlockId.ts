import { TRPCError } from "@trpc/server";

import { publicProcedure } from "../../procedures";
import { isBlockNumber } from "../utils";
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
      .then((block) => (block ? formatFullBlockForApi(block) : null));

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No block with number, slot or hash '${id}'.`,
      });
    }

    return block;
  });
