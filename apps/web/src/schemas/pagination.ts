import { z } from "@blobscan/zod";

export const paginationParamsSchema = z.object({
  cursor: z.string().optional(),
  ps: z.coerce.number().optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
