import { z } from "@blobscan/zod";

export const handleReorgedSlotsInputSchema = z.object({
  reorgedSlots: z.array(z.coerce.number().positive()).nonempty(),
});

export const handleReorgedSlotsOutputSchema = z.object({
  totalUpdatedSlots: z.number(),
});

export type HandleReorgedSlotsInput = z.infer<
  typeof handleReorgedSlotsInputSchema
>;
