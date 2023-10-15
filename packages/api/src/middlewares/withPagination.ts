import { z } from "zod";

import { t } from "../trpc-client";

export const DEFAULT_PAGE_LIMIT = 25;

export const paginationSchema = z
  .object({
    p: z.number().optional(),
    ps: z.number().optional(),
  })
  .optional();

export type PaginationInput = z.infer<typeof paginationSchema>;

export const withPagination = t.middleware(({ next, input }) => {
  const { p: offset = 1, ps: limit = DEFAULT_PAGE_LIMIT } =
    paginationSchema.parse(input) ?? {};

  return next({
    ctx: {
      pagination: {
        take: limit,
        skip: (offset - 1) * limit,
      } as const,
    },
  });
});
