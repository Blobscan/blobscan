import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "~/env";
import { rateLimited } from "~/rate-limit";
import handler from "../../src/pages/api/feedback/index";

vi.mock("~/env", () => ({
  env: {
    FEEDBACK_WEBHOOK_URL: "https://hooks.example.com/feedback",
  },
}));

vi.mock("~/rate-limit", () => ({
  rateLimited: vi.fn().mockResolvedValue(false),
}));

vi.mock("@blobscan/open-telemetry", () => ({
  api: {
    metrics: {
      getMeter: () => ({
        createCounter: () => ({
          add: vi.fn(),
        }),
      }),
    },
    ValueType: { INT: 0 },
  },
}));

const WEBHOOK_URL = "https://hooks.example.com/feedback";

function createMockReq(
  overrides: Partial<NextApiRequest> = {}
): NextApiRequest {
  return {
    method: "POST",
    body: {
      message: "Great tool!",
      rate: "🙂",
      metadata: { pathname: "/", query: {} },
    },
    headers: {},
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes() {
  const res = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
    setHeader: vi.fn(),
  };
  return res as unknown as NextApiResponse & {
    statusCode: number;
    body: unknown;
  };
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimited).mockResolvedValue(false);
    (env as unknown as { FEEDBACK_WEBHOOK_URL: string }).FEEDBACK_WEBHOOK_URL =
      WEBHOOK_URL;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("should return 200 on successful submission", async () => {
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "success" });
  });

  it("should send correct payload to webhook", async () => {
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(fetch).toHaveBeenCalledWith(WEBHOOK_URL, {
      method: "POST",
      body: expect.stringContaining("Great tool!"),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("should return 429 when rate limited", async () => {
    vi.mocked(rateLimited).mockResolvedValue({
      retryAfterSeconds: 7,
      points: 2,
      durationSeconds: 10,
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "7");
    expect(res.body).toEqual({
      code: "TOO_MANY_REQUESTS",
      message:
        "Too many requests from your address (limit: 2 per 10 seconds). Retry in 7s. Need more capacity? Contact us at contact@blobscan.com",
    });
  });

  it("should return 500 when feedback is not enabled", async () => {
    (env as unknown as { FEEDBACK_WEBHOOK_URL: string }).FEEDBACK_WEBHOOK_URL =
      "";

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Feedback is not enabled" });
  });

  it("should return 405 for non-POST methods", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ message: "Method not allowed" });
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
  });

  it("should return 400 when rate is missing", async () => {
    const req = createMockReq({
      body: { message: "Hello", metadata: { pathname: "/", query: {} } },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "A reaction is required" });
  });

  it("should return 400 when rate is not a string", async () => {
    const req = createMockReq({
      body: {
        message: "Hello",
        rate: 123,
        metadata: { pathname: "/", query: {} },
      },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "A reaction is required" });
  });

  it("should return 502 when webhook fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ message: "Failed to deliver feedback" });
  });

  it("should return 500 when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Network error" });
  });

  it("should succeed with empty message", async () => {
    const req = createMockReq({
      body: {
        message: "",
        rate: "🙂",
        metadata: { pathname: "/", query: {} },
      },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledWith(WEBHOOK_URL, {
      method: "POST",
      body: expect.stringContaining("Message: "),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("should succeed without message field", async () => {
    const req = createMockReq({
      body: {
        rate: "😐",
        metadata: { pathname: "/blocks", query: {} },
      },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledWith(WEBHOOK_URL, {
      method: "POST",
      body: expect.stringContaining("Message: -"),
      headers: { "Content-Type": "application/json" },
    });
  });
});
