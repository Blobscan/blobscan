import { z } from "zod";

import { t } from "../clients/trpc";

const DEFAULT_LIMIT = 25;

export const PAGINATION_SCHEMA = z.object({
  p: z.number().optional(),
  ps: z.number().optional(),
});

export const withPagination = t.middleware(({ next, input }) => {
  const { p, ps } = PAGINATION_SCHEMA.parse(input);

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

export const paginatedProcedure = t.procedure
  .input(PAGINATION_SCHEMA)
  .use(withPagination);
