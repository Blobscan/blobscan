import { z } from "@blobscan/zod";

import { filtersSchema } from "../../middlewares/withFilters";
import { paginationSchema } from "../../middlewares/withPagination";
import {
  blobIndexSchema,
  blobStorageSchema,
  blockNumberSchema,
  rollupSchema,
  slotSchema,
} from "../../utils";

export const getAllInputSchema = filtersSchema
  .merge(paginationSchema)
  .optional();

export const getAllOutputSchema = z.object({
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      proof: z.string().nullable(),
      size: z.number(),
      dataStorageReferences: z.array(
        z.object({
          blobStorage: blobStorageSchema,
          dataReference: z.string(),
        })
      ),
      rollup: rollupSchema.nullable(),
      timestamp: z.string(),
      index: blobIndexSchema,
      txHash: z.string(),
      blockNumber: blockNumberSchema,
      slot: slotSchema,
    })
  ),
  totalBlobs: z.number(),
});

export type GetAllOutput = z.infer<typeof getAllOutputSchema>;
