import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../../src/pages/api/blob-data";

vi.mock("~/env", () => ({
  env: {
    BLOB_DATA_API_KEY: undefined,
  },
}));

function createMockReq(): NextApiRequest {
  return {
    query: {
      storage: "postgres",
      url: "https://api.example.com/blobs/0x123/data",
    },
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
    send(data: unknown) {
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

describe("GET /api/blob-data", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: async () => "0x0001feff",
      })
    );
  });

  it("decodes hex blob data returned by Postgres storage", async () => {
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(Buffer.from([0x00, 0x01, 0xfe, 0xff]));
  });
});
