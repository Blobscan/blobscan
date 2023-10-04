import { z } from "zod";

import { t } from "../trpc-client";

const DEFAULT_LIMIT = 25;

export const paginationSchema = z.object({
  p: z.number().optional(),
  ps: z.number().optional(),
});

export const withPagination = t.middleware(({ next, input }) => {
  const { p, ps } = paginationSchema.parse(input);

  const limit = ps ?? DEFAULT_LIMIT;
  const offset = p ?? 1;

  return next({
    ctx: {
      pagination: {
        take: limit,
        skip: (offset - 1) * limit,
      } as const,
    },
  });
});
