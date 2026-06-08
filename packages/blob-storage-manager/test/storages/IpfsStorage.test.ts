import { http, HttpResponse } from "msw";
import type { SetupServerApi } from "msw/node";
import { setupServer } from "msw/node";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { env, testValidError } from "@blobscan/test";

import { BlobStorageError, BlobTooLargeError, IpfsGatewayError, InvalidBlobCidError } from "../../src/errors";
import {
  IpfsStorage,
  MAX_RESPONSE_BYTES,
} from "../../src/storages/IpfsStorage";

const MOCK_GATEWAY_URL = "https://ipfs.mock";

const RAW_CODEC = 0x55;
// Fixed CID used only by the store/remove cases (which reject before the CID
// is ever inspected); kept stable so the error-message snapshot stays valid.
const STATIC_CID =
  "bafkreib4bfzpv7hbfnkzxljtlbhanc5a4x6kbxzwrqxbxzwrqxbxzwrqx";
const MOCK_BLOB_HEX = "0x" + "ab".repeat(32);
const MOCK_BLOB_BYTES = Buffer.from(MOCK_BLOB_HEX.slice(2), "hex");

// Bytes the gateway will return that do NOT hash to the requested CID, used
// to exercise the content-integrity check.
const TAMPERED_BYTES = Buffer.from("cd".repeat(32), "hex");

// Content-addressed CIDs derived from the bytes themselves, so the integrity
// check (sha256(bytes) === cid.multihash.digest) passes for the happy path.
async function rawCid(bytes: Uint8Array): Promise<string> {
  return CID.create(1, RAW_CODEC, await sha256.digest(bytes)).toString();
}

let MOCK_CID: string;
// A valid CID (of different bytes) that the mock server does not serve → 404.
let MOCK_UNKNOWN_CID: string;

class IpfsStorageMock extends IpfsStorage {
  constructor(opts: { gatewayUrl?: string; timeoutMs?: number } = {}) {
    super({
      gatewayUrl: opts.gatewayUrl ?? MOCK_GATEWAY_URL,
      chainId: env.CHAIN_ID,
      timeoutMs: opts.timeoutMs,
      // Keep retry-induced sleep negligible so retryable-error tests run
      // comfortably under the default vitest timeout.
      retryBaseDelayMs: 1,
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

  beforeAll(async () => {
    // The shared test setup installs fake timers (vi.useFakeTimers), which
    // would stall the retry backoff's setTimeout and hang every test that
    // exercises a retryable gateway failure. None of these tests depend on a
    // mocked clock, so run them with real timers.
    vi.useRealTimers();

    MOCK_CID = await rawCid(MOCK_BLOB_BYTES);
    MOCK_UNKNOWN_CID = await rawCid(Buffer.from("ff".repeat(32), "hex"));

    ipfsServer = setupServer(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/bafkqaaa`, () => {
        return new HttpResponse(null, { status: 200 });
      }),
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, ({ params }) => {
        const { cid } = params;

        if (cid !== MOCK_CID) {
          return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(MOCK_BLOB_BYTES, {
          status: 200,
          headers: { "Content-Type": "application/vnd.ipld.raw" },
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

  afterAll(() => {
    // Restore the shared setup's fake timers so we don't leak real timers.
    vi.useFakeTimers();
  });

  it("should create a storage", async () => {
    const storage_ = await IpfsStorage.create({
      chainId: env.CHAIN_ID,
      gatewayUrl: MOCK_GATEWAY_URL,
    });

    expect(storage_.chainId).toBe(env.CHAIN_ID);
  });

  it("should throw when calling getBlobUri", () => {
    expect(() => storage.getBlobUri(MOCK_CID)).toThrow(BlobStorageError);
  });

  it("should return 'OK' when gateway is reachable", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  it("should fail health check when gateway returns 5xx", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/bafkqaaa`, () => {
        return new HttpResponse(null, { status: 503 });
      })
    );

    await expect(storage.healthCheck()).rejects.toThrow();
  });

  it("should retrieve a blob by CID and verify its integrity", async () => {
    const result = await storage.getBlob(MOCK_CID);
    expect(result).toBe(MOCK_BLOB_HEX);
  });

  it("should fail when the returned bytes do not match the CID", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse(TAMPERED_BYTES, { status: 200 });
      })
    );

    const error = await storage.getBlob(MOCK_CID).catch((e) => e);
    expect(error).toBeInstanceOf(BlobStorageError);
    expect((error.cause as Error).message).toMatch(/integrity check failed/i);
  });

  it("should fail when gateway returns a non-ok response", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // A non-ok gateway response surfaces as an IpfsGatewayError (propagated
    // unwrapped so callers can inspect its HTTP status / retryability).
    await expect(storage.getBlob(MOCK_CID)).rejects.toBeInstanceOf(
      IpfsGatewayError
    );
  });

  it("should mark 429 responses as retryable", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse(null, { status: 429 });
      })
    );

    const error = await storage.getBlob(MOCK_CID).catch((e) => e);
    expect(error).toBeInstanceOf(IpfsGatewayError);
    expect((error as IpfsGatewayError).retryable).toBe(true);
  });

  it("should mark 500 responses as retryable", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const error = await storage.getBlob(MOCK_CID).catch((e) => e);
    expect(error).toBeInstanceOf(IpfsGatewayError);
    expect((error as IpfsGatewayError).retryable).toBe(true);
  });

  it("should mark 404 responses as non-retryable", async () => {
    const error = await storage.getBlob(MOCK_UNKNOWN_CID).catch((e) => e);
    expect(error).toBeInstanceOf(IpfsGatewayError);
    expect((error as IpfsGatewayError).retryable).toBe(false);
  });

  it("should fail with an invalid CID prefix", async () => {
    await expect(storage.getBlob("not-a-cid")).rejects.toBeInstanceOf(
      InvalidBlobCidError
    );
  });

  it("should fail with a malformed CID (valid prefix, too short)", async () => {
    await expect(storage.getBlob("bafkmalformed")).rejects.toBeInstanceOf(
      InvalidBlobCidError
    );
  });

  it("should fail when response body is too large (Content-Length fast-path)", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        return new HttpResponse("x", {
          status: 200,
          headers: { "Content-Length": "2000000" },
        });
      })
    );

    await expect(storage.getBlob(MOCK_CID)).rejects.toBeInstanceOf(BlobTooLargeError);
  });

  it("should fail when response body is too large (streaming, no Content-Length)", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/:cid`, () => {
        const largeChunk = new Uint8Array(MAX_RESPONSE_BYTES + 1);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(largeChunk);
            controller.close();
          },
        });
        return new HttpResponse(stream, { status: 200 });
      })
    );

    await expect(storage.getBlob(MOCK_CID)).rejects.toBeInstanceOf(BlobTooLargeError);
  });

  it("should fail when gateway is unreachable during health check", async () => {
    ipfsServer.use(
      http.get(`${MOCK_GATEWAY_URL}/ipfs/bafkqaaa`, () => {
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
      await storage.storeBlob(STATIC_CID, "0xdeadbeef");
    },
    BlobStorageError,
    { checkCause: true }
  );

  testValidError(
    "should fail when trying to remove a blob",
    async () => {
      await storage.removeBlob(STATIC_CID);
    },
    BlobStorageError,
    { checkCause: true }
  );
});
