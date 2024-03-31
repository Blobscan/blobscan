import { z } from "zod";

import { t } from "../trpc-client";

export const DEFAULT_PAGE_LIMIT = 25;

export const withPaginationSchema = z.object({
  p: z.number().optional(),
  ps: z.number().optional(),
});

export type WithPaginationSchema = z.infer<typeof withPaginationSchema>;

export const withPagination = t.middleware(({ next, input }) => {
  const { p: offset = 1, ps: limit = DEFAULT_PAGE_LIMIT } =
    withPaginationSchema.optional().parse(input) ?? {};

  return next({
    ctx: {
      pagination: {
        take: limit,
        skip: (offset - 1) * limit,
      } as const,
    },
  });
});
