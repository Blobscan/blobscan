import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../../src/pages/api/blob-data";

vi.mock("~/env", () => ({
  env: {},
}));

const IPFS_URL =
  "https://gateway.example.com/ipfs/bafkreiddxnuvz3e7bivqw4lzgijkn3djem6ukysvvrbiq7adggbon56e4q";

// The first bytes of a blob that the gateway labels as an icon file.
const ICON_LIKE_BLOB = new Uint8Array([0x00, 0x00, 0x02, 0x00, 0xab, 0xcd]);

function createMockReq(query: Record<string, string>): NextApiRequest {
  return { query } as unknown as NextApiRequest;
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
    send(data: unknown) {
      res.body = data;
      return res;
    },
    setHeader: vi.fn(),
  };

  return res;
}

function mockFetchResponse(contentType: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(ICON_LIKE_BLOB, {
        status: 200,
        headers: { "content-type": contentType },
      })
    )
  );
}

describe("GET /api/blob-data", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it.each([
    "image/x-icon",
    "application/vnd.ipld.raw",
    "text/plain",
    "application/octet-stream",
  ])(
    "should return the raw bytes of an IPFS blob served as %s",
    async (contentType) => {
      mockFetchResponse(contentType);
      const res = createMockRes();

      await handler(
        createMockReq({ storage: "ipfs", url: IPFS_URL }),
        res as unknown as NextApiResponse
      );

      expect(res.statusCode).toBe(200);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/octet-stream"
      );
      expect(res.body).toEqual(Buffer.from(ICON_LIKE_BLOB));
    }
  );

  it("should return 500 for an unknown content type of a non-IPFS storage", async () => {
    mockFetchResponse("image/x-icon");
    const res = createMockRes();

    await handler(
      createMockReq({
        storage: "google",
        url: "https://storage.example.com/bucket/blob",
      }),
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(500);
  });
});
