import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { serializedTransactionSchema } from "./common";

const expandKeysSchema = createExpandKeysSchema(["block", "blob"]);

export const getByHashInputSchema = z
  .object({
    hash: z.string(),
  })
  .merge(expandKeysSchema);

export const getByHashOutputSchema = serializedTransactionSchema;
