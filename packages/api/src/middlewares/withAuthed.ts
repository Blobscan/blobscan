import { TRPCError } from "@trpc/server";

import { t } from "../trpc-client";
import type { ServiceClient } from "../utils";

export const withAuthed = (expectedApiClientType: ServiceClient) =>
  t.middleware(({ ctx, next }) => {
    if (ctx.apiClient !== expectedApiClientType) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx,
    });
  });
