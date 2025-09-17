import type { LoggerLevel } from "@blobscan/logger";
import { logger, logLevelEnum } from "@blobscan/logger";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";

export const getLevel = createAuthedProcedure("admin")
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
      level: logLevelEnum,
    })
  )
  .query(() => {
    return {
      level: logger.level as LoggerLevel,
    };
  });
