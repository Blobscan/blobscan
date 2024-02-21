import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";

export const getAllInputSchema = z
  .object({
    reorgs: z.boolean().optional(),
  })
  .merge(paginationSchema)
  .optional();
