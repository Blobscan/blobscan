import { beforeEach, describe, expect, it, vi } from "vitest";

import { SwarmyCloudStorage } from "../../src";
import { BlobStorageError } from "../../src/errors";
import type { SwarmyCloudStorageConfig } from "../../src/storages";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test constants
const TEST_CHAIN_ID = 1;
const TEST_API_KEY = "test-api-key";
const TEST_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const TEST_BLOB_DATA = "0x12bc45f2a2";
const TEST_SWARM_REFERENCE = "10a73599366736e2b7a9b3a2bf2ef61f45a74486cf9153ed294bd87ae5b20883";
const TEST_RAW_DATA = Buffer.from("mock-data");
const TEST_HEX_DATA = `0x${TEST_RAW_DATA.toString("hex")}`;

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

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new SwarmyCloudStorageMock({
      chainId: TEST_CHAIN_ID,
      apiKey: TEST_API_KEY,
    });
  });

  describe("constructor", () => {
    it("should create a SwarmyCloudStorage instance with correct properties", () => {
      expect(storage.name).toBe("SWARMYCLOUD");
      expect(storage.chainId).toBe(TEST_CHAIN_ID);
      expect(storage.apiKey).toBe(TEST_API_KEY);
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
        `${storage.baseUrl}?k=${TEST_API_KEY}`,
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
        swarmReference: TEST_SWARM_REFERENCE,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await storage.storeBlob(TEST_HASH, TEST_BLOB_DATA);

      expect(result).toBe(TEST_SWARM_REFERENCE);
      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}?k=${TEST_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `${storage.getBlobUri(TEST_HASH)}.bin`,
            contentType: "application/octet-stream",
            base64: Buffer.from(TEST_BLOB_DATA.slice(2), "hex").toString("base64"),
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

      await expect(storage.storeBlob(TEST_HASH, TEST_BLOB_DATA)).rejects.toThrow(
        BlobStorageError
      );
    });

    it("should handle missing swarmReference in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }), // Missing swarmReference
      });

      await expect(storage.storeBlob(TEST_HASH, TEST_BLOB_DATA)).rejects.toThrow(
        BlobStorageError
      );
    });
  });

  describe("getBlob", () => {
    it("should retrieve blob successfully", async () => {
      const mockResponse = {
        success: true,
        data: Buffer.from(TEST_RAW_DATA).toString("base64"),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await storage.getBlob(TEST_SWARM_REFERENCE);

      expect(result).toBe(TEST_HEX_DATA);
      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}/${TEST_SWARM_REFERENCE}?k=${TEST_API_KEY}`,
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

      await expect(storage.getBlob(TEST_SWARM_REFERENCE)).rejects.toThrow(
        BlobStorageError
      );
    });
  });

  describe("removeBlob", () => {
    it("should remove blob successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await expect(storage.removeBlob(TEST_SWARM_REFERENCE)).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        `${storage.baseUrl}/${TEST_SWARM_REFERENCE}?k=${TEST_API_KEY}`,
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

      await expect(storage.removeBlob(TEST_SWARM_REFERENCE)).rejects.toThrow(
        BlobStorageError
      );
    });
  });

  describe("getBlobUri", () => {
    it("should generate correct blob URI", () => {
      const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const expectedUri = `${TEST_CHAIN_ID}/12/34/56/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`;

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
        chainId: TEST_CHAIN_ID,
        apiKey: TEST_API_KEY,
      };

      const result = await SwarmyCloudStorage.create(config);
      expect(result).toBeInstanceOf(SwarmyCloudStorage);
    });

    it("should fail when health check fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const config: SwarmyCloudStorageConfig = {
        chainId: TEST_CHAIN_ID,
        apiKey: TEST_API_KEY,
      };

      await expect(SwarmyCloudStorage.create(config)).rejects.toThrow();
    });
  });
});
