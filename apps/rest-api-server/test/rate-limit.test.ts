import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { describe, expect, it, vi } from "vitest";

import {
  buildAllowlist,
  createRateLimitMiddleware,
  getResourcePath,
  isAllowlisted,
} from "../src/middlewares/rate-limit";

const PUBLIC_IP = "203.0.113.7";
const BLOB_DATA =
  "/blobs/0x01b92306a49494848897bfb4b88c2e2d2a99ecd125c5cc22cd3e85ea790d8e38/data";

function request(ip: string, path = "/blocks", method = "GET") {
  return {
    ip,
    path,
    method,
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function response() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    set(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

// Runs the middleware once and resolves with what happened.
async function run(
  middleware: ReturnType<typeof createRateLimitMiddleware>,
  req: Request
) {
  const res = response();
  const passed = await new Promise<boolean>((resolve) => {
    const next = vi.fn(() => resolve(true)) as unknown as NextFunction;
    const original = res.json.bind(res);
    res.json = (body: unknown) => {
      const r = original(body);
      resolve(false);
      return r;
    };
    middleware(req, res as unknown as Response, next);
  });
  return { passed, res };
}

const limiter = (points: number, duration = 1) =>
  new RateLimiterMemory({ points, duration });

const BLOB = BLOB_DATA.replace("/data", "");
const OTHER_BLOB = BLOB.replace("0x01b9", "0x01aa");

describe("rate limit middleware", () => {
  it("lets a client through up to the limit, then answers 429 with Retry-After", async () => {
    const mw = createRateLimitMiddleware({
      limiter: limiter(2),
      allowlist: [],
    });

    expect((await run(mw, request(PUBLIC_IP))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP))).passed).toBe(true);

    const third = await run(mw, request(PUBLIC_IP));
    expect(third.passed).toBe(false);
    expect(third.res.statusCode).toBe(429);
    expect(third.res.headers["Retry-After"]).toBe("1");
    expect(third.res.body).toEqual({
      code: "TOO_MANY_REQUESTS",
      message:
        "Too many requests from your address (limit: 2 per second). Retry in 1s. Need more capacity? Contact us at contact@blobscan.com",
    });
  });

  it("counts each client IP separately", async () => {
    const mw = createRateLimitMiddleware({
      limiter: limiter(1),
      allowlist: [],
    });

    expect((await run(mw, request(PUBLIC_IP))).passed).toBe(true);
    expect((await run(mw, request("198.51.100.9"))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP))).passed).toBe(false);
  });

  it("treats an IPv4-mapped IPv6 address as the same client", async () => {
    const mw = createRateLimitMiddleware({
      limiter: limiter(1),
      allowlist: [],
    });

    expect((await run(mw, request(PUBLIC_IP))).passed).toBe(true);
    expect((await run(mw, request(`::ffff:${PUBLIC_IP}`))).passed).toBe(false);
  });

  it("never limits allowlisted addresses", async () => {
    const mw = createRateLimitMiddleware({
      limiter: limiter(1),
      allowlist: ["10.0.0.0/8", "::1/128"],
    });

    for (let i = 0; i < 5; i++) {
      expect((await run(mw, request("10.42.1.17"))).passed).toBe(true);
      expect((await run(mw, request("::ffff:10.42.1.17"))).passed).toBe(true);
      expect((await run(mw, request("::1"))).passed).toBe(true);
    }
  });

  it("counts /blobs/{id}/data against the same budget as every other route", async () => {
    const mw = createRateLimitMiddleware({
      limiter: limiter(1),
      allowlist: [],
    });

    expect((await run(mw, request(PUBLIC_IP, BLOB_DATA))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP, "/blocks"))).passed).toBe(false);
  });

  it("serves the request when the store fails", async () => {
    const broken = limiter(1);
    broken.consume = () => Promise.reject(new Error("store down"));
    const mw = createRateLimitMiddleware({ limiter: broken, allowlist: [] });

    expect((await run(mw, request(PUBLIC_IP))).passed).toBe(true);
  });
});

describe("repeat limit", () => {
  const withRepeat = (repeat: number, allowlist: string[] = []) =>
    createRateLimitMiddleware({
      limiter: limiter(100),
      repeatLimiter: limiter(repeat, 60),
      allowlist,
    });

  it("rejects the same resource requested again and again, with the shared 429 body", async () => {
    const mw = withRepeat(2);

    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(true);

    const third = await run(mw, request(PUBLIC_IP, BLOB));
    expect(third.passed).toBe(false);
    expect(third.res.statusCode).toBe(429);
    expect(third.res.headers["Retry-After"]).toMatch(/^\d+$/);
    expect(third.res.body).toEqual({
      code: "TOO_MANY_REQUESTS",
      message: expect.stringMatching(
        /^This resource was requested more than 2 times in 60 seconds from your address\. Retry in \d+s\. Need more capacity\? Contact us at contact@blobscan\.com$/
      ),
    });
  });

  it("does not mind many different resources", async () => {
    const mw = withRepeat(1);

    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP, OTHER_BLOB))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP, "/blocks/123"))).passed).toBe(
      true
    );
  });

  it("counts clients separately", async () => {
    const mw = withRepeat(1);

    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(true);
    expect((await run(mw, request("198.51.100.9", BLOB))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(false);
  });

  it("ignores list endpoints and other methods", async () => {
    const mw = withRepeat(1);

    for (let i = 0; i < 3; i++) {
      expect((await run(mw, request(PUBLIC_IP, "/blobs"))).passed).toBe(true);
      expect((await run(mw, request(PUBLIC_IP, "/blocks/latest"))).passed).toBe(
        true
      );
      expect((await run(mw, request(PUBLIC_IP, BLOB, "PUT"))).passed).toBe(
        true
      );
    }
  });

  it("never limits allowlisted addresses", async () => {
    const mw = withRepeat(1, ["10.0.0.0/8"]);

    for (let i = 0; i < 5; i++) {
      expect((await run(mw, request("10.42.1.17", BLOB))).passed).toBe(true);
    }
  });

  it("works without the per-IP limit", async () => {
    const mw = createRateLimitMiddleware({
      repeatLimiter: limiter(1, 60),
      allowlist: [],
    });

    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(true);
    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(false);
  });

  it("serves the request when the store fails", async () => {
    const broken = limiter(1, 60);
    broken.consume = () => Promise.reject(new Error("store down"));
    const mw = createRateLimitMiddleware({
      repeatLimiter: broken,
      allowlist: [],
    });

    expect((await run(mw, request(PUBLIC_IP, BLOB))).passed).toBe(true);
  });
});

describe("getResourcePath", () => {
  it("matches single-resource lookups only", () => {
    expect(getResourcePath(request(PUBLIC_IP, BLOB))).toBe(BLOB);
    expect(getResourcePath(request(PUBLIC_IP, BLOB_DATA))).toBe(BLOB_DATA);
    expect(getResourcePath(request(PUBLIC_IP, "/blocks/25718181/"))).toBe(
      "/blocks/25718181"
    );
    expect(getResourcePath(request(PUBLIC_IP, "/blobs"))).toBeUndefined();
    expect(
      getResourcePath(request(PUBLIC_IP, "/stats/overall"))
    ).toBeUndefined();
  });
});

describe("allowlist", () => {
  it("matches CIDRs and single addresses of both families", () => {
    const list = buildAllowlist([
      "10.0.0.0/8",
      " 192.168.0.0/16 ",
      "fc00::/7",
      "203.0.113.5",
    ]);

    expect(isAllowlisted(list, "10.42.0.1")).toBe(true);
    expect(isAllowlisted(list, "192.168.1.1")).toBe(true);
    expect(isAllowlisted(list, "fd12::1")).toBe(true);
    expect(isAllowlisted(list, "203.0.113.5")).toBe(true);
    expect(isAllowlisted(list, "203.0.113.6")).toBe(false);
    expect(isAllowlisted(list, "8.8.8.8")).toBe(false);
    expect(isAllowlisted(list, "not-an-ip")).toBe(false);
  });

  it("rejects an invalid entry at startup", () => {
    expect(() => buildAllowlist(["10.0.0/8"])).toThrow(
      /Invalid rate limit allowlist entry/
    );
  });
});
