import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";
import { getBlockOutputSchema } from "./common";

export const getAllInputSchema = z
  .object({
    reorgs: z.boolean().optional(),
  })
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  blocks: getBlockOutputSchema.array(),
  totalBlocks: z.number(),
});
