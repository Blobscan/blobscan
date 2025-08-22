import { TRPCError } from "@trpc/server";

import { parsedBlockIdSchema } from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withFilters,
  withTypeFilterSchema,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { fetchBlock, toResponseBlock, responseBlockSchema } from "./helpers";

const inputSchema = z
  .object({
    id: parsedBlockIdSchema,
  })
  .merge(withTypeFilterSchema)
  .merge(createExpandsSchema(["transaction", "blob"]));

const outputSchema = responseBlockSchema.transform(normalize);

export const getByBlockId = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/blocks/{id}`,
      tags: ["blocks"],
      summary: "retrieves block details for given block number or hash.",
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .use(withFilters)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, expands, filters }, input: { id } }) => {
    const prismaBlock = await fetchBlock(id, {
      prisma,
      filters,
      expands,
    });

    if (!prismaBlock) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Block with id "${id.value}" not found`,
      });
    }

    return toResponseBlock(prismaBlock);
  });
