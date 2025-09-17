import { TRPCError } from "@trpc/server";

import type { BlockIdField } from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { withFilters } from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { responseBlockSchema, fetchBlock, toResponseBlock } from "./helpers";

const inputSchema = z
  .object({
    slot: z.coerce.number().int().positive(),
  })
  .merge(createExpandsSchema(["transaction", "blob"]));

const outputSchema = responseBlockSchema.transform(normalize);

export const getBySlot = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/slots/{slot}`,
      tags: ["slots"],
      summary: "retrieves block details for given slot.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .use(withExpands)
  .use(withFilters)
  .query(async ({ ctx: { prisma, filters, expands }, input: { slot } }) => {
    const blockIdField: BlockIdField = { type: "slot", value: slot };

    const res = await fetchBlock(blockIdField, {
      prisma,
      filters,
      expands,
    });

    if (!res) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Block with slot ${slot} not found`,
      });
    }

    return toResponseBlock(res.block, res.ethUsdPrice?.price);
  });
