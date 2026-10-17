import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { describe, expect, it, vi } from "vitest";

import {
  buildAllowlist,
  createRateLimitMiddleware,
  isAllowlisted,
} from "../src/middlewares/rate-limit";

const PUBLIC_IP = "203.0.113.7";
const BLOB_DATA =
  "/blobs/0x01b92306a49494848897bfb4b88c2e2d2a99ecd125c5cc22cd3e85ea790d8e38/data";

function request(ip: string, path = "/blocks") {
  return { ip, path, socket: { remoteAddress: ip } } as unknown as Request;
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

const limiter = (points: number) =>
  new RateLimiterMemory({ points, duration: 1 });

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
