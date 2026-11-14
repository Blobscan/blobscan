import type { NextFunction, Request, Response } from "express";
import { RateLimiterRes } from "rate-limiter-flexible";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createRepeatLimitMiddleware,
  getRepeatLimitKey,
} from "../src/middlewares/repeat-limit";
import type { RepeatLimitMode } from "../src/middlewares/repeat-limit";

const { loggerWarnMock } = vi.hoisted(() => ({ loggerWarnMock: vi.fn() }));

vi.mock("@blobscan/logger", () => ({ logger: { warn: loggerWarnMock } }));
vi.mock("@blobscan/env", () => ({ env: {} }));
vi.mock("../src/clients/redis", () => ({ redis: { status: "ready" } }));

const HASH = `0x01${"ab".repeat(31)}`;

function req(path: string, method = "GET", ip = "1.2.3.4") {
  return {
    method,
    path,
    ip,
    socket: {},
    get: () => "test-agent",
  } as unknown as Request;
}

function res() {
  const r = { status: vi.fn(), set: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  r.set.mockReturnValue(r);
  r.json.mockReturnValue(r);

  return r;
}

function setup(mode: RepeatLimitMode, consume = vi.fn()) {
  const middleware = createRepeatLimitMiddleware({
    limiter: { consume },
    mode,
    points: 6,
    durationSeconds: 60,
    isRedisReady: () => true,
  });

  return { middleware, consume };
}

const limited = () =>
  vi.fn().mockRejectedValue(new RateLimiterRes(0, 12_300, 0, false));

describe("getRepeatLimitKey", () => {
  it("keys single-resource lookups by client and path", () => {
    expect(getRepeatLimitKey(req(`/blobs/${HASH}`))).toBe(
      `1.2.3.4:/blobs/${HASH}`
    );
    expect(getRepeatLimitKey(req(`/blobs/${HASH}/data`))).toBeDefined();
    expect(getRepeatLimitKey(req(`/transactions/${HASH}`))).toBeDefined();
    expect(getRepeatLimitKey(req("/blocks/25718181"))).toBeDefined();
  });

  it("ignores list endpoints, other methods and special ids", () => {
    expect(getRepeatLimitKey(req("/blobs"))).toBeUndefined();
    expect(getRepeatLimitKey(req("/blocks/latest"))).toBeUndefined();
    expect(getRepeatLimitKey(req("/stats/overall"))).toBeUndefined();
    expect(getRepeatLimitKey(req(`/blobs/${HASH}`, "PUT"))).toBeUndefined();
  });

  it("treats case and a trailing slash as the same resource", () => {
    expect(
      getRepeatLimitKey(
        req(`/blobs/${HASH.toUpperCase().replace("0X", "0x")}/`)
      )
    ).toBe(getRepeatLimitKey(req(`/blobs/${HASH}`)));
  });
});

describe("createRepeatLimitMiddleware", () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => vi.clearAllMocks());

  it("does nothing when off", async () => {
    const { middleware, consume } = setup("off");

    await middleware(req(`/blobs/${HASH}`), res() as unknown as Response, next);

    expect(consume).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("lets requests under the limit through", async () => {
    const { middleware, consume } = setup(
      "enforce",
      vi.fn().mockResolvedValue({})
    );
    const r = res();

    await middleware(req(`/blobs/${HASH}`), r as unknown as Response, next);

    expect(consume).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(r.status).not.toHaveBeenCalled();
  });

  it("does not count requests that are not single-resource lookups", async () => {
    const { middleware, consume } = setup("enforce");

    await middleware(req("/blobs"), res() as unknown as Response, next);

    expect(consume).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects with 429 and Retry-After when enforcing", async () => {
    const { middleware } = setup("enforce", limited());
    const r = res();

    await middleware(req(`/blobs/${HASH}`), r as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(r.status).toHaveBeenCalledWith(429);
    expect(r.set).toHaveBeenCalledWith("Retry-After", "13");
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOO_MANY_REQUESTS" })
    );
  });

  it("only logs in log mode", async () => {
    const { middleware } = setup("log", limited());
    const r = res();

    await middleware(req(`/blobs/${HASH}`), r as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(r.status).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledWith(
      "Repeat limit would reject request",
      expect.objectContaining({ retryAfter: 13 })
    );
  });

  it("fails open when Redis errors", async () => {
    const { middleware } = setup(
      "enforce",
      vi.fn().mockRejectedValue(new Error("boom"))
    );
    const r = res();

    await middleware(req(`/blobs/${HASH}`), r as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(r.status).not.toHaveBeenCalled();
  });

  it("fails open when Redis is not ready", async () => {
    const consume = vi.fn();
    const middleware = createRepeatLimitMiddleware({
      limiter: { consume },
      mode: "enforce",
      points: 6,
      durationSeconds: 60,
      isRedisReady: () => false,
    });

    await middleware(req(`/blobs/${HASH}`), res() as unknown as Response, next);

    expect(consume).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
});
