import { http, HttpResponse } from "msw";
import type { SetupServerApi } from "msw/node";
import { setupServer } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { env, testValidError } from "@blobscan/test";

import { BlobStorageError } from "../../src/errors";
import { IpfsStorage } from "../../src/storages/IpfsStorage";

const MOCK_GATEWAY_URL = "https://ipfs.mock";

const MOCK_CID = "bafkreib4bfzpv7hbfnkzxljtlbhanc5a4x6kbxzwrqxbxzwrqxbxzwrqx";
const MOCK_BLOB_HEX = "0x" + "ab".repeat(32);
const MOCK_TEXT_CONTENT = "hello blob";

class IpfsStorageMock extends IpfsStorage {
  constructor(opts: { gatewayUrl?: string; timeoutMs?: number } = {}) {
    super({
      gatewayUrl: opts.gatewayUrl ?? MOCK_GATEWAY_URL,
      chainId: env.CHAIN_ID,
      timeoutMs: opts.timeoutMs,
    });
  }

  healthCheck() {
    return super.healthCheck();
  }

  get resolvedGatewayUrl() {
    return this.gatewayUrl;
  }

  get resolvedTimeoutMs() {
    return this.timeoutMs;
  }
}

describe("IpfsStorage", () => {
  let ipfsServer: SetupServerApi;
  let storage: IpfsStorageMock;

  beforeAll(() => {
    ipfsServer = setupServer(
      http.head(`${MOCK_GATEWAY_URL}/ipfs/bafkqaaa`, () => {
        return new HttpResponse(null, { status: 200 });
      }),
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, ({ params }) => {
        const { cid } = params;

        if (cid === `${MOCK_CID}.txt`) {
          return new HttpResponse(MOCK_TEXT_CONTENT, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          });
        }

        if (cid !== MOCK_CID) {
          return new HttpResponse(null, { status: 404 });
        }

        const data = Buffer.from(MOCK_BLOB_HEX.slice(2), "hex");
        return new HttpResponse(data, {
          status: 200,
          headers: { "Content-Type": "application/octet-stream" },
        });
      })
    );

    ipfsServer.listen();

    return () => {
      ipfsServer.close();
    };
  });

  beforeEach(() => {
    storage = new IpfsStorageMock();
  });

  afterEach(() => {
    ipfsServer.resetHandlers();
  });

  it("should create a storage", async () => {
    const storage_ = await IpfsStorage.create({
      chainId: env.CHAIN_ID,
      gatewayUrl: MOCK_GATEWAY_URL,
    });

    expect(storage_.chainId).toBe(env.CHAIN_ID);
  });

  it("should return the CID as blob URI", () => {
    const uri = storage.getBlobUri(MOCK_CID);
    expect(uri).toBe(MOCK_CID);
  });

  it("should return 'OK' when gateway is reachable", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  it("should retrieve a blob by CID", async () => {
    const result = await storage.getBlob(MOCK_CID);
    expect(result).toBe(MOCK_BLOB_HEX);
  });

  it("should retrieve a text blob by CID with .txt extension", async () => {
    const result = await storage.getBlob(`${MOCK_CID}.txt`);
    expect(result).toBe(MOCK_TEXT_CONTENT);
  });

  it("should fail when gateway returns a non-ok response", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    await expect(storage.getBlob(MOCK_CID)).rejects.toBeInstanceOf(
      BlobStorageError
    );
  });

  it("should tag retryable errors for 429 responses", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse(null, { status: 429 });
      })
    );

    await expect(storage.getBlob(MOCK_CID)).rejects.toThrow("retryable");
  });

  it("should fail with an invalid CID", async () => {
    await expect(storage.getBlob("not-a-cid")).rejects.toThrow(
      "Invalid IPFS CID"
    );
  });

  it("should fail when gateway is unreachable during health check", async () => {
    ipfsServer.use(
      http.head(`${MOCK_GATEWAY_URL}/ipfs/bafkqaaa`, () => {
        return HttpResponse.error();
      })
    );

    await expect(storage.healthCheck()).rejects.toThrow();
  });

  it("should strip trailing slash from gateway URL", () => {
    const s = new IpfsStorageMock({ gatewayUrl: `${MOCK_GATEWAY_URL}/` });
    expect(s.resolvedGatewayUrl).toBe(MOCK_GATEWAY_URL);
  });

  it("should use default timeout when not specified", () => {
    expect(storage.resolvedTimeoutMs).toBe(30_000);
  });

  it("should accept a custom timeout", () => {
    const s = new IpfsStorageMock({ timeoutMs: 5000 });
    expect(s.resolvedTimeoutMs).toBe(5000);
  });

  testValidError(
    "should fail when trying to store a blob",
    async () => {
      await storage.storeBlob(MOCK_CID, "0xdeadbeef");
    },
    BlobStorageError,
    { checkCause: true }
  );

  testValidError(
    "should fail when trying to remove a blob",
    async () => {
      await storage.removeBlob(MOCK_CID);
    },
    BlobStorageError,
    { checkCause: true }
  );
});
