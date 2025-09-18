import { TRPCError } from "@trpc/server";

import { t } from "../trpc-client";
import type { ApiClient } from "../utils";

export const withAuthed = (expectedApiClientType: ApiClient) =>
  t.middleware(({ ctx, next }) => {
    if (ctx.apiClient !== expectedApiClientType) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx,
    });
  });
