import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { allFiltersSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";
import { serializedTransactionSchema } from "./common";

export const getAllInputSchema = allFiltersSchema
  .merge(paginationSchema)
  .merge(createExpandKeysSchema(["block", "blob"]))
  .optional();

export const getAllOutputSchema = z.object({
  transactions: serializedTransactionSchema.array(),
  totalTransactions: z.number(),
});

export type GetAllOutput = z.infer<typeof getAllOutputSchema>;
