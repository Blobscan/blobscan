import { z } from "@blobscan/zod";

import { paginationSchema } from "../../middlewares/withPagination";

export const getAllInputSchema = z
  .object({
    rollup: z
      .enum(["arbitrum", "base", "optimism", "scroll", "starknet", "zksync"])
      .optional(),
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
