import { z } from "@blobscan/zod";

export const getStateInputSchema = z.void();

export const getStateOutputSchema = z.object({
  lastLowerSyncedSlot: z.number().nullable(),
  lastUpperSyncedSlot: z.number().nullable(),
  lastFinalizedBlock: z.number().nullable(),
});
