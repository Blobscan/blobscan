import { afterEach, describe, expect, it, vi } from "vitest";

import { env, rpcUrlsSchema } from "../index";

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

  describe("when parsing ETH_PRICE_SYNCER_RPC_URLS", () => {
    it("should return the RPC URL of each chain", () => {
      expect(
        rpcUrlsSchema.parse(
          "137=https://polygon.example/key?a=b, 1=http://127.0.0.1:8545"
        )
      ).toEqual({
        137: "https://polygon.example/key?a=b",
        1: "http://127.0.0.1:8545",
      });
    });

    it("should ignore empty entries", () => {
      expect(rpcUrlsSchema.parse("1=http://127.0.0.1:8545,")).toEqual({
        1: "http://127.0.0.1:8545",
      });
    });

    it.each([
      ["an entry without a chain ID", "https://polygon.example"],
      ["a chain ID that is not a number", "polygon=https://polygon.example"],
      ["a URL that is not valid", "137=not-a-url"],
      [
        "the same chain ID two times",
        "137=https://a.example,137=https://b.example",
      ],
    ])("should reject %s", (_, value) => {
      expect(rpcUrlsSchema.safeParse(value).success).toBe(false);
    });

    it.each([
      ["an entry without a chain ID", "https://rpc.example/v2/secret"],
      ["a chain ID that is not valid", "x=https://rpc.example/v2/secret"],
      ["a URL that is not valid", "137=rpc.example/v2/secret"],
    ])("should not show the URL in the error for %s", (_, value) => {
      const result = rpcUrlsSchema.safeParse(value);

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error)).not.toContain("secret");
    });
  });
});
