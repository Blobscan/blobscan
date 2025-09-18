import { beforeEach, describe, expect, it } from "vitest";

import { logger } from "@blobscan/logger";

import type { TRPCContext } from "../../src";
import { createTestContext, unauthorizedRPCCallTest } from "../helpers";
import { createLoggingCaller } from "./caller";
import type { LoggingCaller } from "./caller";

describe("getLevel", () => {
  let nonAuthorizedCaller: LoggingCaller;

  let authorizedCaller: LoggingCaller;
  let authorizedCtx: TRPCContext;

  beforeEach(async () => {
    const originalLoggerLevel = logger.level;
    authorizedCtx = await createTestContext({
      apiClient: "admin",
    });

    authorizedCaller = createLoggingCaller(authorizedCtx);

    nonAuthorizedCaller = createLoggingCaller(await createTestContext());

    return () => {
      logger.level = originalLoggerLevel;
    };
  });

  beforeEach(() => {
    logger.level = "info";
  });

  it("should return the current log level", async () => {
    const result = await authorizedCaller.getLevel();

    expect(result).toEqual({
      level: "info",
    });
  });

  unauthorizedRPCCallTest(() => nonAuthorizedCaller.getLevel());
});
