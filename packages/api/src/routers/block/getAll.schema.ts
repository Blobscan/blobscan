import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { allFiltersSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";
import { serializedBlockSchema } from "./common";

export const getAllBlocksInputSchema = allFiltersSchema
  .merge(paginationSchema)
  .merge(createExpandKeysSchema(["transaction", "blob"]))
  .optional();

export const getAllBlocksOutputSchema = z.object({
  blocks: serializedBlockSchema.array(),
  totalBlocks: z.number(),
});
