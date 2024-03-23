import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { sortFilterSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";

const expandKeysSchema = createExpandKeysSchema(["block", "blob"]);

export const getByAddressInputSchema = z
  .object({
    address: z.string(),
  })
  .merge(paginationSchema)
  .merge(expandKeysSchema)
  .merge(sortFilterSchema);
