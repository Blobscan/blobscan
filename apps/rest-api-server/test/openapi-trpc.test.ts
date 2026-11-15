import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

import { setUpOpenApiTRPC } from "../src/openapi-trpc";

vi.mock("@blobscan/api", async () => {
  const { initTRPC } = await import("@trpc/server");
  const { z } = await import("@blobscan/zod");
  const { openApiOverride } = await import("../../../packages/api/src/openapi");
  const t = initTRPC
    .meta<{ openapi: { method: "GET"; path: string } }>()
    .create();
  const router = t.router({
    transaction: t.procedure
      .meta({ openapi: { method: "GET", path: "/transactions/{hash}" } })
      .input(z.object({ hash: z.string() }))
      .output(z.object({ hash: z.string() }).transform((value) => value))
      .query(({ input }) => input),
  });
  return {
    createAppRouter: () => router,
    createTRPCContext: () => () => ({}),
    openApiOverride,
  };
});
vi.mock("@blobscan/env", () => ({
  env: { BLOBSCAN_API_BASE_URL: "http://localhost:3001" },
}));
vi.mock("@blobscan/blob-storage-manager", () => ({
  BlobStorageManager: vi.fn(),
}));
vi.mock("@blobscan/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("../src/chain", () => ({ chain: {}, rollupRegistry: {} }));
vi.mock("../src/clients/prisma", () => ({ prisma: {} }));
vi.mock("../src/clients/redis", () => ({ redis: {} }));
vi.mock("../src/services/blob-propagator", () => ({
  getBlobPropagator: async () => undefined,
}));
vi.mock("../src/services/blob-storages", () => ({
  createBlobStorages: async () => [],
}));

afterEach(() => vi.unstubAllEnvs());

describe("OpenAPI middleware setup", () => {
  it.each(["development", "production"])(
    "accepts transformed response schemas in %s",
    async (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      await expect(setUpOpenApiTRPC(express())).resolves.toBeUndefined();
    }
  );
});
