import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "../index";

describe("@blobscan/env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("validates and coerces environment variables during test runs", () => {
    expect(env.CHAIN_ID).toBeTypeOf("number");
    expect(env.S3_STORAGE_ENABLED).toBeTypeOf("boolean");
    expect(env.S3_STORAGE_FORCE_PATH_STYLE).toBeTypeOf("boolean");
    expect(env.PRISMA_BATCH_OPERATIONS_MAX_SIZE).toBeTypeOf("number");
    expect(env.BLOB_DATA_API_ENABLED).toBeTypeOf("boolean");
    expect(env.BLOBSCAN_API_PORT).toBeTypeOf("number");
    expect(env.PRIMARY_BLOB_STORAGE).toBe("POSTGRES");
  });

  it("keeps validation enabled for CI test runs", async () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.resetModules();

    const { presetEnvOptions } = await import("@blobscan/zod");

    expect(presetEnvOptions.skipValidation).toBe(false);
  });

  it("skips validation for CI builds outside tests", async () => {
    vi.stubEnv("CI", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.resetModules();

    const { presetEnvOptions } = await import("@blobscan/zod");

    expect(presetEnvOptions.skipValidation).toBe(true);
  });
});
