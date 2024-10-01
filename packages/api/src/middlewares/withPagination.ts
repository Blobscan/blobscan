import { z } from "@blobscan/zod";

import { t } from "../trpc-client";

export const DEFAULT_PAGE_LIMIT = 50;

export const withPaginationSchema = z.object({
  p: z.number().default(1),
  ps: z.number().default(DEFAULT_PAGE_LIMIT),
  count: z.boolean().default(false),
});

export type WithPaginationSchema = z.input<typeof withPaginationSchema>;

export const withPagination = t.middleware(({ next, input }) => {
  const {
    p: offset,
    ps: limit,
    count,
  } = withPaginationSchema.default({}).parse(input) ?? {};

  return next({
    ctx: {
      count,
      pagination: {
        take: limit,
        skip: (offset - 1) * limit,
      } as const,
    },
  });
});
