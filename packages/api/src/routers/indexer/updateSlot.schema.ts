import { z } from "@blobscan/zod";

export const updateSlotInputSchema = z.object({ slot: z.number() });

export const updateSlotOutputSchema = z.void();

export type UpdateSlotInput = z.infer<typeof updateSlotInputSchema>;
