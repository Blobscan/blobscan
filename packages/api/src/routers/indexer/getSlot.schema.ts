import { z } from "@blobscan/zod";

export const getSlotInputSchema = z.void();

export const getSlotOutputSchema = z.object({ slot: z.number() });
