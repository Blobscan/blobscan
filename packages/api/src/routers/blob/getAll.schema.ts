import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";
import { rollupSchema } from "../../utils";

export const getAllInputSchema = z
  .object({
    rollup: rollupSchema.optional(),
  })
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      proof: z.string().or(z.null()),
      size: z.number(),
    })
  ),
  totalBlobs: z.number(),
});
