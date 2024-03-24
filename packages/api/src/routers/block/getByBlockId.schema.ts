import { z } from "@blobscan/zod";

import { createExpandKeysSchema } from "../../middlewares/withExpands";
import { serializedBlockSchema } from "./common";

export const blockIdSchema = z
  .string()
  .refine(
    (id) => {
      const isHash = id.startsWith("0x") && id.length === 66;
      const s_ = Number(id);
      const isNumber = !isNaN(s_) && s_ > 0;

      return isHash || isNumber;
    },
    {
      message: "Invalid block id",
    }
  )
  .transform((id) => {
    if (id.startsWith("0x")) {
      return id;
    }

    return Number(id);
  });

export type BlockId = z.infer<typeof blockIdSchema>;

export const getByBlockIdInputSchema = z
  .object({
    id: blockIdSchema,
    reorg: z.boolean().optional(),
  })
  .merge(createExpandKeysSchema(["transaction", "blob"]));

export const getByBlockIdOutputSchema = serializedBlockSchema;
