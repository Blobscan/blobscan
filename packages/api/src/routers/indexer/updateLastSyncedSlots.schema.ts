import { z } from "@blobscan/zod";

export const updateLastSyncedSlotsInputSchema = z.object({
  lastLowerSyncedSlot: z.number().optional(),
  lastUpperSyncedSlot: z.number().optional(),
});

export const updateLastSyncedSlotsOutputSchema = z.void();

export type UpdateLastSyncedSlotsInput = z.infer<
  typeof updateLastSyncedSlotsInputSchema
>;
