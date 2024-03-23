import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { serializedBlockSchema } from "./common";

export const blockIdSchema = z
  .string()
  .refine(
    (s) => {
      if (s.startsWith("0x") && s.length === 66) {
        return s;
      }
    },
    {
      message: "Invalid block id",
    }
  )
  .or(z.coerce.number().positive());

export type BlockId = z.infer<typeof blockIdSchema>;

export const getByBlockIdInputSchema = z
  .object({
    id: blockIdSchema,
    reorg: z.boolean().optional(),
  })
  .merge(createExpandKeysSchema(["transaction", "blob"]));

export const getByBlockIdOutputSchema = serializedBlockSchema;
