import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "../src/app-router";
import { createTestContext, unauthorizedRPCCallTest } from "./helpers";
import * as logger from "@blobscan/logger";

// Mock the logger module
vi.mock("@blobscan/logger", async () => {
  const actual = await vi.importActual("@blobscan/logger");
  return {
    ...actual as object,
    getLogLevel: vi.fn(),
    setLogLevel: vi.fn(),
  };
});

describe("Logging Router", () => {
  const mockGetLogLevel = vi.mocked(logger.getLogLevel);
  const mockSetLogLevel = vi.mocked(logger.setLogLevel);

  beforeEach(() => {
    // Reset mocks before each test
    mockGetLogLevel.mockReset();
    mockSetLogLevel.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getLevel", () => {
    it("should return the current log level", async () => {
      // Arrange
      const ctx = await createTestContext({
        apiClient: { type: "admin" },
      });
      const caller = appRouter.createCaller(ctx);
      mockGetLogLevel.mockReturnValue("info");

      // Act
      const result = await caller.logging.getLevel();

      // Assert
      expect(mockGetLogLevel).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        level: "info",
        success: true,
      });
    });

    it("should fail when calling procedure without auth", async () => {
      await unauthorizedRPCCallTest(async () => {
        const ctx = await createTestContext();
        const caller = appRouter.createCaller(ctx);
        return caller.logging.getLevel();
      });
    });
  });

  describe("setLevel", () => {
    it("should change the log level successfully", async () => {
      // Arrange
      const ctx = await createTestContext({
        apiClient: { type: "admin" },
      });
      const caller = appRouter.createCaller(ctx);
      mockGetLogLevel.mockReturnValue("info");
      mockSetLogLevel.mockReturnValue(true);

      // Act
      const result = await caller.logging.setLevel({ level: "debug" });

      // Assert
      expect(mockGetLogLevel).toHaveBeenCalledTimes(1);
      expect(mockSetLogLevel).toHaveBeenCalledWith("debug");
      expect(result).toEqual({
        level: "debug",
        previousLevel: "info",
        success: true,
      });
    });

    it("should handle failure when setting log level", async () => {
      // Arrange
      const ctx = await createTestContext({
        apiClient: { type: "admin" },
      });
      const caller = appRouter.createCaller(ctx);
      mockGetLogLevel.mockReturnValue("info");
      mockSetLogLevel.mockReturnValue(false);

      // Act
      const result = await caller.logging.setLevel({ level: "debug" });

      // Assert
      expect(mockGetLogLevel).toHaveBeenCalledTimes(1);
      expect(mockSetLogLevel).toHaveBeenCalledWith("debug");
      expect(result).toEqual({
        level: "debug",
        previousLevel: "info",
        success: false,
      });
    });

    it("should fail when calling procedure without auth", async () => {
      await unauthorizedRPCCallTest(async () => {
        const ctx = await createTestContext();
        const caller = appRouter.createCaller(ctx);
        return caller.logging.setLevel({ level: "debug" });
      });
    });
  });
});
