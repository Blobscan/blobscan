import { z } from "@blobscan/zod";

export const feeUnitSchema = z.enum(["eth", "usd"]);

export const feeUnitParamsSchema = z.object({
  unit: feeUnitSchema.optional(),
});

export type FeeUnitParams = z.infer<typeof feeUnitParamsSchema>;
