import { z } from "@blobscan/zod";

import { filtersSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";
import { serializedTransactionSchema } from "./common";

export const getAllInputSchema = filtersSchema
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  transactions: serializedTransactionSchema.array(),
  totalTransactions: z.number(),
});

export type GetAllOutput = z.infer<typeof getAllOutputSchema>;
