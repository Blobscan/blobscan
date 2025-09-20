import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-openapi";
import { ZodError } from "zod";

import type { TRPCContext } from "./context";
import { superjson } from "./superjson";

export const t = initTRPC
  .context<TRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === "BAD_REQUEST" && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      };
    },
  });
