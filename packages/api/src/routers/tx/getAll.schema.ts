import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";
import { rollupSchema } from "../../utils";
import { TransactionSchema } from "./common";

export const getAllInputSchema = z
  .object({
    rollup: rollupSchema.optional(),
  })
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  transactions: TransactionSchema.array(),
  totalTransactions: z.number(),
});
