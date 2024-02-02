import { z } from "@blobscan/zod";

export const getByAddressInputSchema = z.object({
  address: z.string(),
});
