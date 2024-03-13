import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { OpenApiMeta } from "trpc-openapi";
import { ZodError } from "zod";

import { logger } from "@blobscan/logger";

import type { TRPCContext } from "./context";
import { env } from "./env";

export const t = initTRPC
  .context<TRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      if (
        error.code === "INTERNAL_SERVER_ERROR" &&
        env.NODE_ENV === "production"
      ) {
        logger.info(error.cause.errors);
        return { ...shape, message: "Internal server error" };
      }

      // Log to sentry
      // https://github.com/trpc/trpc/issues/4120
      // if (process.env.NODE_ENV === "production") {
      //   Sentry.captureException(error);
      // }
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });
