import { beforeEach, describe, expect, it, vi } from "vitest";

import { SwarmyCloudStorage } from "../../src";
import { BlobStorageError } from "../../src/errors";
import type { SwarmyCloudStorageConfig } from "../../src/storages";

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

  get apiKey(): string {
    return this["apiKey"];
  }

  get baseUrl(): string {
    return this["baseUrl"];
  }
}

describe("SwarmyCloudStorage", () => {
  let storage: SwarmyCloudStorageMock;
  const mockApiKey = "test-api-key";
  const mockSwarmReference = "10a73599366736e2b7a9b3a2bf2ef61f45a74486cf9153ed294bd87ae5b20883";

  beforeAll(() => {
    storage = new SwarmyCloudStorageMock({
      chainId: env.CHAIN_ID,
      apiKey: mockApiKey,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a SwarmyCloudStorage instance with correct properties", () => {
      expect(storage.name).toBe("SWARMYCLOUD");
      expect(storage.chainId).toBe(env.CHAIN_ID);
      expect(storage.apiKey).toBe(mockApiKey);
      expect(storage.baseUrl).toBe("https://api.swarmy.cloud/api/data/bin");
    });
  });

  describe("healthCheck", () => {
    it("should pass when API is reachable", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await storage.healthCheck();
      expect(result).toBe("OK");
      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}?k=${mockApiKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should fail when API is not reachable", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(storage.healthCheck()).rejects.toThrow(
        "Storage is not reachable"
      );
    });

    it("should fail when API returns error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(storage.healthCheck()).rejects.toThrow(
        "Storage is not reachable"
      );
    });
  });

  describe("storeBlob", () => {
    it("should store blob successfully", async () => {
      const mockResponse = {
        id: 1,
        swarmReference: mockSwarmReference,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);

      expect(result).toBe(mockSwarmReference);
      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}?k=${mockApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `${storage.getBlobUri(NEW_BLOB_HASH)}.bin`,
            contentType: "application/octet-stream",
            base64: Buffer.from(NEW_BLOB_DATA.slice(2), "hex").toString("base64"),
          }),
        }
      );
    });

    it("should handle upload failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await testValidError(
        () => storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA),
        BlobStorageError,
        "Failed to store blob with hash"
      );
    });

    it("should handle missing swarmReference in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }), // Missing swarmReference
      });

      await testValidError(
        () => storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA),
        BlobStorageError,
        "Failed to store blob with hash"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await testValidError(
        () => storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA),
        BlobStorageError,
        "Failed to store blob with hash"
      );
    });
  });

  describe("getBlob", () => {
    it("should retrieve blob successfully", async () => {
      const mockResponse = {
        success: true,
        data: Buffer.from(RAW_DATA).toString("base64"),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await storage.getBlob(mockSwarmReference);

      expect(result).toBe(HEX_DATA);
      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}/${mockSwarmReference}?k=${mockApiKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should handle retrieval failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await testValidError(
        () => storage.getBlob(mockSwarmReference),
        BlobStorageError,
        `Failed to get blob with uri "${mockSwarmReference}"`
      );
    });

    it("should handle API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Blob not found",
        }),
      });

      await testValidError(
        () => storage.getBlob(mockSwarmReference),
        BlobStorageError,
        `Failed to get blob with uri "${mockSwarmReference}"`
      );
    });

    it("should handle missing data in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          // Missing data field
        }),
      });

      await testValidError(
        () => storage.getBlob(mockSwarmReference),
        BlobStorageError,
        `Failed to get blob with uri "${mockSwarmReference}"`
      );
    });
  });

  describe("removeBlob", () => {
    it("should remove blob successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await expect(storage.removeBlob(mockSwarmReference)).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}/${mockSwarmReference}?k=${mockApiKey}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should handle removal failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await testValidError(
        () => storage.removeBlob(mockSwarmReference),
        BlobStorageError,
        `Failed to remove blob with uri "${mockSwarmReference}"`
      );
    });

    it("should handle API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Deletion failed",
        }),
      });

      await testValidError(
        () => storage.removeBlob(mockSwarmReference),
        BlobStorageError,
        `Failed to remove blob with uri "${mockSwarmReference}"`
      );
    });
  });

  describe("getBlobUri", () => {
    it("should generate correct blob URI", () => {
      const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const expectedUri = `${env.CHAIN_ID}/12/34/56/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`;

      const result = storage.getBlobUri(hash);
      expect(result).toBe(expectedUri);
    });
  });

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

    it("should fail when health check fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const config: SwarmyCloudStorageConfig = {
        chainId: env.CHAIN_ID,
        apiKey: mockApiKey,
      };

      await expect(SwarmyCloudStorage.create(config)).rejects.toThrow();
    });
  });
});
