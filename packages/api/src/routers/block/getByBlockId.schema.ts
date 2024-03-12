import { z } from "@blobscan/zod";

import { BlockSchema, blockIdSchema } from "./common";

export const getByBlockIdSchema = z.object({
  id: z.string(),
  reorg: z.boolean().optional(),
});

export const getByBlockIdFullSchema = z.object({
  id: blockIdSchema,
  reorg: z.boolean().optional(),
});

export const getByBlockIdOutputSchema = BlockSchema;
