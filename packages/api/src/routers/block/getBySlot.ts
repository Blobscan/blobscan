import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { withFilters } from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import type { BlockIdField } from "./common";
import { fetchBlock, serializeBlock, serializedBlockSchema } from "./common";

const inputSchema = z
  .object({
    slot: z.coerce.number().int().positive(),
  })
  .merge(createExpandsSchema(["transaction", "blob"]));

const outputSchema = serializedBlockSchema;

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
  .query(
    async ({
      ctx: { blobStorageManager, prisma, filters, expands },
      input: { slot },
    }) => {
      const blockIdField: BlockIdField = { type: "slot", value: slot };

      const block = await fetchBlock(blockIdField, {
        blobStorageManager,
        prisma,
        filters,
        expands,
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Block with slot ${slot} not found`,
        });
      }

      return serializeBlock(block);
    }
  );
