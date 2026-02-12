import { z } from "zod";

export const sortSchema = z.enum(["desc", "asc"]);

export const sortParamsSchema = z.object({
  sort: sortSchema.optional(),
});

export type Sort = z.infer<typeof sortSchema>;
export type SortParams = z.infer<typeof sortParamsSchema>;
