import { TRPCError } from "@trpc/server";

import { blockNumberSchema } from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { adjacentDirectionSchema, normalize } from "../../utils";
import {
  createBlockSelect,
  responseBlockSchema,
  toResponseBlock,
} from "./helpers";

const inputSchema = z
  .object({
    blockNumber: blockNumberSchema,
    direction: adjacentDirectionSchema,
  })
  .merge(createExpandsSchema(["transaction", "blob"]));

const outputSchema = responseBlockSchema.transform(normalize);

export const getAdjacentBlock = publicProcedure
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(
    async ({ ctx: { expands, prisma }, input: { blockNumber, direction } }) => {
      const whereOperator = direction === "next" ? "gt" : "lt";
      const sortOperator = direction === "next" ? "asc" : "desc";

      const [adjacentBlock, ethUsdPrice] = await Promise.all([
        prisma.block.findFirst({
          select: createBlockSelect(expands),
          where: {
            transactionForks: {
              none: {},
            },
            number: {
              [whereOperator]: blockNumber,
            },
          },
          orderBy: {
            number: sortOperator,
          },
        }),
        prisma.block.findAdjacentEthUsdPrice(blockNumber, direction),
      ]);

      if (!adjacentBlock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No ${direction} block found for block ${blockNumber}`,
        });
      }

      return toResponseBlock(adjacentBlock, ethUsdPrice?.price);
    }
  );
