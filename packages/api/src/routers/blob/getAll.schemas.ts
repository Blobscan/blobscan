import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { allFiltersSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";
import { serializedBlobOnTransactionSchema } from "./common/serializers";

export const getAllInputSchema = allFiltersSchema
  .merge(paginationSchema)
  .merge(createExpandKeysSchema(["block", "transaction"]))
  .optional();

export const getAllOutputSchema = z.object({
  blobs: serializedBlobOnTransactionSchema.array(),
  totalBlobs: z.number(),
});

export type GetAllOutput = z.infer<typeof getAllOutputSchema>;
