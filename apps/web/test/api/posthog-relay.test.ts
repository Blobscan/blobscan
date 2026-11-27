import { Readable } from "node:stream";
import type { NextApiRequest } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../../src/pages/api/relay/[...path]";

const env = vi.hoisted(() => ({
  PUBLIC_POSTHOG_ID: "phc_test" as string | undefined,
  PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
  PUBLIC_POSTHOG_PROXY_ENABLED: true,
}));

vi.mock("~/env", () => ({ env }));
vi.mock("~/rate-limit", () => ({ getClientIp: () => "203.0.113.7" }));

function createMockReq({
  url,
  method = "POST",
  headers = {},
  body = [],
}: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Buffer[];
}): NextApiRequest {
  return Object.assign(Readable.from(body), {
    url,
    method,
    headers,
  }) as unknown as NextApiRequest;
}

function createMockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    ended: false,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
    send(data: unknown) {
      res.body = data;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
  };

  return res;
}

async function callRelay(req: NextApiRequest) {
  const res = createMockRes();

  await handler(req, res as never);

  return res;
}

describe("/api/relay", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    env.PUBLIC_POSTHOG_ID = "phc_test";
    env.PUBLIC_POSTHOG_PROXY_ENABLED = true;
    fetchMock.mockResolvedValue(
      new Response('{"status":1}', {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": "tracking=1",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards an event batch with its body, headers and the client IP", async () => {
    const body = Buffer.from("compressed-batch");
    const res = await callRelay(
      createMockReq({
        url: "/api/relay/e/?compression=gzip-js",
        headers: {
          "content-type": "text/plain",
          "user-agent": "Mozilla/5.0",
          cookie: "session=secret",
        },
        body: [body],
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.toString()).toBe(
      "https://us.i.posthog.com/e/?compression=gzip-js"
    );
    expect(init.method).toBe("POST");
    expect(Buffer.from(init.body as Uint8Array)).toEqual(body);
    // The cookies of this site are not sent to PostHog.
    expect(init.headers).toEqual({
      "content-type": "text/plain",
      "user-agent": "Mozilla/5.0",
      "x-forwarded-for": "203.0.113.7",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers).toEqual({ "content-type": "application/json" });
    expect(Buffer.from(res.body as Buffer).toString()).toBe('{"status":1}');
  });

  it("gets the SDK assets from the assets host", async () => {
    await callRelay(
      createMockReq({
        url: "/api/relay/array/phc_test/config.js",
        method: "GET",
      })
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.toString()).toBe(
      "https://us-assets.i.posthog.com/array/phc_test/config.js"
    );
    expect(init.body).toBeUndefined();
  });

  it.each([
    ["PostHog is not configured", { PUBLIC_POSTHOG_ID: undefined }],
    ["the proxy is disabled", { PUBLIC_POSTHOG_PROXY_ENABLED: false }],
  ])("answers 404 when %s", async (_, overrides) => {
    Object.assign(env, overrides);

    const res = await callRelay(createMockReq({ url: "/api/relay/e/" }));

    expect(res.statusCode).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 404 for a path that the SDK does not use", async () => {
    const res = await callRelay(
      createMockReq({ url: "/api/relay/api/projects/", method: "GET" })
    );

    expect(res.statusCode).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 405 for other methods", async () => {
    const res = await callRelay(
      createMockReq({ url: "/api/relay/e/", method: "DELETE" })
    );

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("GET, HEAD, POST");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 413 when the body is larger than 1 MB", async () => {
    const res = await callRelay(
      createMockReq({
        url: "/api/relay/batch/",
        body: [Buffer.alloc(600 * 1024), Buffer.alloc(600 * 1024)],
      })
    );

    expect(res.statusCode).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when PostHog cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = await callRelay(createMockReq({ url: "/api/relay/e/" }));

    expect(res.statusCode).toBe(502);
  });

  it("forwards the status of PostHog", async () => {
    fetchMock.mockResolvedValue(new Response("Bad request", { status: 400 }));

    const res = await callRelay(createMockReq({ url: "/api/relay/e/" }));

    expect(res.statusCode).toBe(400);
  });
});
