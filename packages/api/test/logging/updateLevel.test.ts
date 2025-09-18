import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it } from "vitest";

import { logger } from "@blobscan/logger";
import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext, unauthorizedRPCCallTest } from "../helpers";
import type { LoggingCaller } from "./caller";
import { createLoggingCaller } from "./caller";

describe("updateLevel", () => {
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

  it("should update the log level successfully", async () => {
    await authorizedCaller.updateLevel({ level: "debug" });

    expect(logger.level).toBe("debug");
  });

  it("should return new and previous level", async () => {
    const result = await authorizedCaller.updateLevel({ level: "debug" });

    expect(result).toEqual({
      level: "debug",
      previousLevel: "info",
    });
  });

  unauthorizedRPCCallTest(() =>
    nonAuthorizedCaller.updateLevel({
      level: "debug",
    })
  );

  testValidError(
    "should fail when providing an invalid log level",
    async () => {
      await authorizedCaller.updateLevel({
        level: "unknown-level",
      });
    },
    TRPCError,
    {
      checkCause: true,
    }
  );
});
