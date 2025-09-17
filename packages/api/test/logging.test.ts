import { TRPCError } from "@trpc/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { logger } from "@blobscan/logger";
import { testValidError } from "@blobscan/test";

import type { TRPCContext } from "../src";
import { loggingRouter } from "../src/routers/logging";
import { createTestContext, unauthorizedRPCCallTest } from "./helpers";

describe("Logging Router", () => {
  let nonAuthorizedLoggingCaller: ReturnType<typeof loggingRouter.createCaller>;

  let loggingCaller: ReturnType<typeof loggingRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    const originalLoggerLevel = logger.level;
    ctx = await createTestContext({
      apiClient: "admin",
    });

    loggingCaller = loggingRouter.createCaller(ctx);

    nonAuthorizedLoggingCaller = loggingRouter.createCaller(
      await createTestContext()
    );

    return () => {
      logger.level = originalLoggerLevel;
    };
  });

  beforeEach(() => {
    logger.level = "info";
  });

  describe("getLevel", () => {
    it("should return the current log level", async () => {
      const result = await loggingCaller.getLevel();

      expect(result).toEqual({
        level: "info",
      });
    });

    unauthorizedRPCCallTest(() => nonAuthorizedLoggingCaller.getLevel());
  });

  describe("updateLevel", () => {
    it("should update the log level successfully", async () => {
      await loggingCaller.updateLevel({ level: "debug" });

      expect(logger.level).toBe("debug");
    });

    it("should return new and previous level", async () => {
      const result = await loggingCaller.updateLevel({ level: "debug" });

      expect(result).toEqual({
        level: "debug",
        previousLevel: "info",
      });
    });

    unauthorizedRPCCallTest(() =>
      nonAuthorizedLoggingCaller.updateLevel({
        level: "debug",
      })
    );

    testValidError(
      "should fail when providing an invalid log level",
      async () => {
        await loggingCaller.updateLevel({
          level: "unknown-level",
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );
  });
});
