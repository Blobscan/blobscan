import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { t } from "../trpc-client";

export const DEFAULT_PAGE_LIMIT = 50;

export const withPaginationSchema = z.object({
  cursor: z.string().min(1).max(4096).optional(),
  ps: z.number().int().min(1).max(100).default(DEFAULT_PAGE_LIMIT),
  count: z.boolean().default(false),
});

export type WithPaginationSchema = z.input<typeof withPaginationSchema>;

export const withPagination = t.middleware(
  async ({ next, input, getRawInput }) => {
    const rawInput = await getRawInput();
    if (rawInput && typeof rawInput === "object" && "p" in rawInput) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "The p parameter is no longer supported. Use cursor pagination.",
      });
    }
    const {
      cursor,
      ps: limit,
      count,
    } = withPaginationSchema.parse(input ?? {});

    return next({
      ctx: {
        count,
        pagination: {
          cursor,
          limit,
        } as const,
      },
    });
  }
);
