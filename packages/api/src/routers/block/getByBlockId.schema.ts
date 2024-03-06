import { z } from "@blobscan/zod";

import { BlockSchema } from "./common";

export const getByBlockIdSchema = z.object({
  id: z.string(),
  reorg: z.boolean().optional(),
});

export const getByBlockIdOutputSchema = BlockSchema;
