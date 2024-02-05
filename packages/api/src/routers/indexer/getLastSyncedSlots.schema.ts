import { z } from "@blobscan/zod";

export const getLastSyncedSlotsInputSchema = z.void();

export const getLastSyncedSlotsOutputSchema = z.object({
  lastLowerSyncedSlot: z.number().nullable(),
  lastUpperSyncedSlot: z.number().nullable(),
});
