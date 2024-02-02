import { TRPCError } from "@trpc/server";

import { t } from "../trpc-client";

export const isJWTAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.apiClient) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx,
  });
});
