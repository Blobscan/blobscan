import type { LoggerLevel } from "@blobscan/logger";
import { logger, logLevelEnum } from "@blobscan/logger";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";
import { toLogLevelSchema } from "../../zod-schemas";

export const updateLevel = createAuthedProcedure("admin")
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
      level: toLogLevelSchema,
    })
  )
  .output(
    z.object({
      level: logLevelEnum,
      previousLevel: logLevelEnum,
    })
  )
  .mutation(({ input }) => {
    const { level } = input;
    const previousLevel = logger.level as LoggerLevel;

    logger.level = level;

    return {
      level,
      previousLevel,
    };
  });
