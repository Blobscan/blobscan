import { z } from "@blobscan/zod";

export const updateStateInputSchema = z.object({
  lastLowerSyncedSlot: z.number().optional(),
  lastUpperSyncedSlot: z.number().optional(),
  lastFinalizedBlock: z.number().optional(),
});

export const updateStateOutputSchema = z.void();

export type UpdateStateInput = z.infer<typeof updateStateInputSchema>;
