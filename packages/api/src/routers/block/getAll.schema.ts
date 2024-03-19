import { z } from "@blobscan/zod";

import { baseGetAllInputSchema } from "../../utils";
import { BlockSchema } from "./common";

export const getAllBlocksInputSchema = baseGetAllInputSchema;

export const getAllBlocksOutputSchema = z.object({
  blocks: BlockSchema.array(),
  totalBlocks: z.number(),
});
