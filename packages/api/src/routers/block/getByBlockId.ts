import { TRPCError } from "@trpc/server";

import { blockHashSchema } from "@blobscan/db/prisma/zod-utils";
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
import type { BlockIdField } from "./helpers";
import { fetchBlock, toResponseBlock, responseBlockSchema } from "./helpers";

const blockNumberSchema = z.coerce.number().int().positive();

// We use zod's string schema and then parse the value by applying block hash or block number
// schemas as `trpc-opeanpi` doesn't support union types yet.
const blockIdSchema = z.string().transform((value, ctx) => {
  const parsedHash = blockHashSchema.safeParse(value);
  const parsedBlockNumber = blockNumberSchema.safeParse(value);

  if (parsedHash.success) {
    return parsedHash.data;
  }

  if (parsedBlockNumber.success) {
    return parsedBlockNumber.data;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Block id must be a valid block number or block hash",
  });
});

const inputSchema = z
  .object({
    id: blockIdSchema,
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
  .query(
    async ({
      ctx: { blobStorageManager, prisma, expands, filters },
      input: { id },
    }) => {
      let blockIdField: BlockIdField | undefined;

      const parsedHash = blockHashSchema.safeParse(id);
      const parsedBlockNumber = blockNumberSchema.safeParse(id);

      if (parsedHash.success) {
        blockIdField = { type: "hash", value: parsedHash.data };
      } else if (parsedBlockNumber.success) {
        blockIdField = { type: "number", value: parsedBlockNumber.data };
      }

      if (!blockIdField) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid block id "${id}"`,
        });
      }

      const prismaBlock = await fetchBlock(blockIdField, {
        blobStorageManager,
        prisma,
        filters,
        expands,
      });

      if (!prismaBlock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Block with id "${id}" not found`,
        });
      }

      return toResponseBlock(prismaBlock);
    }
  );
