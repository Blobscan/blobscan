import { TRPCError } from "@trpc/server";

import { t } from "../trpc-client";
import type { APIClientType } from "../utils";

export const withAuthed = (expectedApiClientType: APIClientType) =>
  t.middleware(({ ctx, next }) => {
    if (ctx.apiClient?.type !== expectedApiClientType) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx,
    });
  });
