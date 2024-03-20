import { z } from "@blobscan/zod";

import { filtersSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";
import { BlockSchema } from "./common";

export const getAllBlocksInputSchema = filtersSchema
  .merge(paginationSchema)
  .optional();

export const getAllBlocksOutputSchema = z.object({
  blocks: BlockSchema.array(),
  totalBlocks: z.number(),
});
