import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { SetupServerApi } from "msw/node";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { env, testValidError } from "@blobscan/test";

import {
  SWARMY_FETCH_URL,
  SWARMY_UPLOAD_URL,
  SwarmyCloudStorage,
} from "../../src";
import { BlobStorageError } from "../../src/errors";
import type { SwarmyCloudStorageConfig } from "../../src/storages";
import { HEX_DATA, NEW_BLOB_DATA, NEW_BLOB_HASH, RAW_DATA } from "../fixtures";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

class SwarmyCloudStorageMock extends SwarmyCloudStorage {
  constructor(config: SwarmyCloudStorageConfig) {
    super(config);
  }

  healthCheck() {
    return super.healthCheck();
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getBaseUrl(): string {
    return this.uploadUrl;
  }
}

describe("SwarmyCloudStorage", () => {
  let swarmyServer: SetupServerApi;
  let storage: SwarmyCloudStorageMock;
  const mockApiKey = "test-api-key";
  const mockSwarmReference =
    "10a73599366736e2b7a9b3a2bf2ef61f45a74486cf9153ed294bd87ae5b20883";

  beforeAll(() => {
    swarmyServer = setupServer(
      http.get(`${SWARMY_FETCH_URL}/:uri`, ({ params }) => {
        const uri = params.uri;

        if (!uri) {
          return HttpResponse.json(
            {
              success: false,
              error: "invalid path params",
            },
            {
              status: 400,
            }
          );
        }

        if (uri === mockSwarmReference) {
          return HttpResponse.arrayBuffer(RAW_DATA, {
            status: 200,
          });
        }

        return HttpResponse.json(
          {
            success: false,
            error: "blob not found",
          },
          {
            status: 404,
          }
        );
      }),
      http.post(SWARMY_UPLOAD_URL, async () => {
        return HttpResponse.json({
          id: 1,
          swarmReference: mockSwarmReference,
        });
      })
    );

    swarmyServer.listen();

    storage = new SwarmyCloudStorageMock({
      chainId: env.CHAIN_ID,
      apiKey: mockApiKey,
    });

    return () => {
      swarmyServer.close();
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    swarmyServer.resetHandlers();
  });

  describe("constructor", () => {
    it("should create a SwarmyCloudStorage instance with correct properties", () => {
      expect(storage.name).toBe("SWARMYCLOUD");
      expect(storage.chainId).toBe(env.CHAIN_ID);
      expect(storage.getApiKey()).toBe(mockApiKey);
      expect(storage.getBaseUrl()).toBe(
        "https://api.swarmy.cloud/api/data/bin"
      );
    });
  });

  describe("healthCheck", () => {
    it("should pass", async () => {
      const result = await storage.healthCheck();

      expect(result).toBe("OK");
    });
  });

  describe("storeBlob", () => {
    it("should store blob successfully", async () => {
      const result = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);

      expect(result).toEqual(mockSwarmReference);
    });

    testValidError(
      "should handle upload failure",
      async () => {
        swarmyServer.use(
          http.post(SWARMY_UPLOAD_URL, () => {
            return HttpResponse.json(
              {
                code: 500,
                message: "Internal server error",
              },
              {
                status: 500,
              }
            );
          })
        );
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );
  });

  describe("getBlob", () => {
    it("should retrieve blob successfully", async () => {
      const result = await storage.getBlob(mockSwarmReference);

      expect(result).toBe(HEX_DATA);
    });

    testValidError(
      "should handle non-existing blob retrieval",
      async () => {
        await storage.getBlob("2131244123");
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );
  });

  testValidError(
    "should fail when trying to remove blob",
    async () => {
      await storage.removeBlob(mockSwarmReference);
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should fail when trying to get blob uri",
    () => {
      storage.getBlobUri("0x");
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );

  describe("create", () => {
    it("should create storage instance successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const config: SwarmyCloudStorageConfig = {
        chainId: env.CHAIN_ID,
        apiKey: mockApiKey,
      };

      const result = await SwarmyCloudStorage.create(config);
      expect(result).toBeInstanceOf(SwarmyCloudStorage);
    });
  });
});
