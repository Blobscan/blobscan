import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";
import { TransactionSchema } from "./common";

export const getAllInputSchema = z
  .object({
    rollup: z
      .enum(["arbitrum", "base", "optimism", "scroll", "starknet", "zksync"])
      .optional(),
  })
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  transactions: TransactionSchema.array(),
  totalTransactions: z.number(),
});
