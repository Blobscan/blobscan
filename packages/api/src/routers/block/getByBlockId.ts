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
import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
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
      description: "This endpoint retrieves block details for given block number or hash. However, blocks are only stored if they contain blobs. If a valid block id is entered, but that blob does not contain any blobs, then the endpoint will return an error."
    },
  })
  .input(inputSchema)
  .use(withExpands)
  .use(withFilters)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(async ({ ctx: { prisma, expands, filters }, input: { id } }) => {
    const res = await fetchBlock(id, {
      prisma,
      filters,
      expands,
    });

    if (!res) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Block with id "${id.value}" not found`,
      });
    }

    return toResponseBlock(res.block, res.ethUsdPrice?.price);
  });
