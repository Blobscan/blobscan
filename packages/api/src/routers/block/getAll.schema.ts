import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";
import { BlockSchema } from "./common";

export const getAllInputSchema = z
  .object({
    reorgs: z.boolean().optional(),
  })
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  blocks: BlockSchema.array(),
  totalBlocks: z.number(),
});
