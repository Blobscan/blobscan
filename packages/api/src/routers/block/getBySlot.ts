import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import {
  withFilters,
  withSortFilterSchema,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import type { BlockIdField } from "./common";
import { fetchBlock, serializeBlock } from "./common";

const inputSchema = z
  .object({
    slot: z.coerce.number().int().positive(),
  })
  .merge(withSortFilterSchema)
  .merge(createExpandsSchema(["transaction", "blob", "blob_data"]));

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
