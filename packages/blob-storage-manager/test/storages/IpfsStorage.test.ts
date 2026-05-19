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

class IpfsStorageMock extends IpfsStorage {
  constructor() {
    super({
      gatewayUrl: MOCK_GATEWAY_URL,
      chainId: env.CHAIN_ID,
    });
  }

  healthCheck() {
    return super.healthCheck();
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
