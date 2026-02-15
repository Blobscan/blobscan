import { z } from "@blobscan/zod";

export const paginationParamsSchema = z.object({
  p: z.coerce.number().optional(),
  ps: z.coerce.number().optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
