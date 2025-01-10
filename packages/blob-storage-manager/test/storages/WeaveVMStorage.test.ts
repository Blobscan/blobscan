import { http, HttpResponse } from "msw";
import type { SetupServerApi } from "msw/node";
import { setupServer } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { env } from "@blobscan/env";
import { testValidError } from "@blobscan/test";

import { BlobStorageError } from "../../src/errors";
import { WeaveVMStorage } from "../../src/storages/WeaveVMStorage";

const MOCK_API_BASE_URL = "https://blobscan.weavevm";

const MOCK_RESPONSES: Record<string, string> = {
  "0x01b4b4b2b62f7a206efcb78e2ed6ef5bde9c1ac33d4d44eccfd43aa951ef1d22":
    "0x4fe40fc67f9c3a3ffa2be77d10fe7818",
};

class WeaveVMStorageMock extends WeaveVMStorage {
  constructor() {
    super({
      apiBaseUrl: MOCK_API_BASE_URL,
      chainId: env.CHAIN_ID,
    });
  }

  healthCheck() {
    return super.healthCheck();
  }
}

describe("WeavevmStorage", () => {
  let weavevmServer: SetupServerApi;
  let storage: WeaveVMStorageMock;

  beforeAll(() => {
    weavevmServer = setupServer(
      http.get(`${MOCK_API_BASE_URL}/v1/blob/:uri`, ({ request }) => {
        const uri = request.url.split("/").pop();

        if (!uri) {
          return HttpResponse.json({
            code: 400,
            message: "invalid path params",
          });
        }

        const blobData = MOCK_RESPONSES[uri];

        if (!blobData) {
          return HttpResponse.json({
            code: 404,
            message: "blob not found",
          });
        }

        return HttpResponse.json({
          blob_data: blobData,
        });
      }),
      http.get(`${MOCK_API_BASE_URL}/v1/stats`, () => {
        return HttpResponse.json({
          blob_versioned_hash:
            "0x01b4b4b2b62f7a206efcb78e2ed6ef5bde9c1ac33d4d44eccfd43aa951ef1d22",
          last_archived_eth_block: 19559986,
          wvm_archive_txid:
            "0x01ee8325bc5607a16dd64ff2bcbec7d596b170f31def52615abf6b3f25ceb5a5",
        });
      })
    );

    weavevmServer.listen();

    return () => {
      weavevmServer.close();
    };
  });

  beforeEach(() => {
    storage = new WeaveVMStorageMock();
  });

  afterEach(() => {
    weavevmServer.resetHandlers();
  });

  it("should create a storage", async () => {
    const storage_ = await WeaveVMStorage.create({
      chainId: env.CHAIN_ID,
      apiBaseUrl: MOCK_API_BASE_URL,
    });

    expect(storage_.chainId, "Chain ID mismatch").toBe(env.CHAIN_ID);
    expect(storage_.apiBaseUrl).toBe(MOCK_API_BASE_URL);
  });

  it("return the correct uri given a blob hash", () => {
    const blobHash = "exampleBlobHash";
    const blobUri = storage.getBlobUri(blobHash);

    expect(blobUri).toBe(blobHash);
  });

  it("should return 'OK' if storage is healthy", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  it("should get a blob given its reference", async () => {
    const blobHash = Object.keys(MOCK_RESPONSES)[0] as string;

    const result = await storage.getBlob(blobHash);

    expect(result).toBe(MOCK_RESPONSES[blobHash]);
  });

  testValidError(
    "should fail when trying to parse an invalid blob retrieval response",
    async () => {
      weavevmServer.use(
        http.get(`${MOCK_API_BASE_URL}/v1/blob/:uri`, () => {
          return HttpResponse.json({
            blob_data: 123,
          });
        })
      );

      await storage.getBlob("invalidBlobHash");
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should fail when trying to store a blob",
    async () => {
      await storage.storeBlob("blobHash", "blobData");
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should fail when trying to remove a blob",
    async () => {
      await storage.removeBlob("blobHash");
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );
});
