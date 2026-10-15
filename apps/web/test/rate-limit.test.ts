import type { NextApiRequest } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({ TRUSTED_PROXY_COUNT: 0 }));

vi.mock("~/env", () => ({
  env: mockEnv,
}));

vi.mock("~/redis", () => ({
  redis: { status: "wait" },
}));

import { getClientIp } from "~/rate-limit";

function req(
  headers: NextApiRequest["headers"],
  remoteAddress?: string
): NextApiRequest {
  return {
    headers,
    socket: { remoteAddress },
  } as unknown as NextApiRequest;
}

describe("getClientIp", () => {
  beforeEach(() => {
    mockEnv.TRUSTED_PROXY_COUNT = 0;
  });

  it("falls back to the socket peer when there is no forwarded header", () => {
    expect(getClientIp(req({}, "10.0.0.5"))).toBe("10.0.0.5");
  });

  it("returns undefined when neither header nor socket peer is available", () => {
    expect(getClientIp(req({}))).toBeUndefined();
  });

  it("with 0 trusted proxies, uses the right-most (direct peer) forwarded entry", () => {
    // Legacy topology: no trusted hops => the last appended entry is the peer.
    expect(
      getClientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))
    ).toBe("10.0.0.1");
  });

  it("skips trusted proxy hops from the right to find the real client", () => {
    mockEnv.TRUSTED_PROXY_COUNT = 1;
    expect(
      getClientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))
    ).toBe("203.0.113.7");
  });

  it("ignores a spoofed left-most IP when counting from the right", () => {
    // Attacker prepends a fake IP; with 1 trusted hop the real client is the
    // entry our proxy appended, not the spoofed left-most value.
    mockEnv.TRUSTED_PROXY_COUNT = 1;
    expect(
      getClientIp(
        req({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.1" })
      )
    ).toBe("203.0.113.7");
  });

  it("handles the header arriving as multiple values", () => {
    mockEnv.TRUSTED_PROXY_COUNT = 1;
    expect(
      getClientIp(req({ "x-forwarded-for": ["203.0.113.7", "10.0.0.1"] }))
    ).toBe("203.0.113.7");
  });

  it("trims whitespace around addresses", () => {
    expect(
      getClientIp(req({ "x-forwarded-for": "  1.2.3.4  ,  10.0.0.1  " }))
    ).toBe("10.0.0.1");
  });

  it("falls back to the socket peer when the hop count exceeds the chain", () => {
    mockEnv.TRUSTED_PROXY_COUNT = 5;
    expect(
      getClientIp(req({ "x-forwarded-for": "1.2.3.4" }, "10.0.0.9"))
    ).toBe("10.0.0.9");
  });
});
