import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";
import { TransactionSchema } from "./common";

export const getAllInputSchema = paginationSchema.optional();

export const getAllOutputSchema = z.object({
  transactions: TransactionSchema.array(),
  totalTransactions: z.number(),
});
