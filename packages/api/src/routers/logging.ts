import type { LoggerLevel } from "@blobscan/logger";
import { getLogLevel, setLogLevel } from "@blobscan/logger";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../procedures";
import { t } from "../trpc-client";

// Define the valid log levels as a Zod enum
const LogLevelEnum = z.enum(["error", "warn", "info", "http", "debug"]);
const adminProcedure = createAuthedProcedure("admin");

export const loggingRouter = t.router({
  getLevel: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/logging/level",
        summary: "Get the current logging level",
        tags: ["system"],
      },
    })
    .input(z.void())
    .output(
      z.object({
        level: LogLevelEnum,
        success: z.boolean(),
      })
    )
    .query(() => {
      const currentLevel = getLogLevel();

      return {
        level: currentLevel,
        success: true,
      };
    }),

  setLevel: adminProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: "/logging/level",
        summary: "Change the logging level",
        tags: ["system"],
      },
    })
    .input(
      z.object({
        level: LogLevelEnum,
      })
    )
    .output(
      z.object({
        level: LogLevelEnum,
        previousLevel: LogLevelEnum,
        success: z.boolean(),
      })
    )
    .mutation(({ input }) => {
      const { level } = input;
      const previousLevel = getLogLevel();
      const success = setLogLevel(level as LoggerLevel);

      return {
        level,
        previousLevel,
        success,
      };
    }),
});
