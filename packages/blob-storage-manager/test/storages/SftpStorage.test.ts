import type Client from "ssh2-sftp-client";
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

import type { SftpStorageConfig } from "../../src";
import { SftpStorage } from "../../src";

if (
  !env.SFTP_STORAGE_HOST ||
  !env.SFTP_STORAGE_USERNAME ||
  !env.SFTP_STORAGE_PASSWORD ||
  !env.SFTP_STORAGE_PATH ||
  !env.SFTP_STORAGE_PORT
) {
  throw new Error(
    "SFTP_STORAGE_HOST, SFTP_STORAGE_USERNAME, SFTP_STORAGE_PASSWORD, SFTP_STORAGE_PATH, and SFTP_STORAGE_PORT are required"
  );
}

const SFTP_STORAGE_CONFIG: SftpStorageConfig = {
  chainId: env.CHAIN_ID,
  host: env.SFTP_STORAGE_HOST,
  port: env.SFTP_STORAGE_PORT,
  username: env.SFTP_STORAGE_USERNAME,
  password: env.SFTP_STORAGE_PASSWORD,
  path: env.SFTP_STORAGE_PATH,
};

class SftpStorageMock extends SftpStorage {
  constructor(config?: SftpStorageConfig) {
    super(config ?? SFTP_STORAGE_CONFIG);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isConnecting(): boolean {
    return this._isConnecting;
  }

  async healthCheck() {
    return super.healthCheck();
  }

  // Expose protected methods for testing
  get client(): Client {
    return this._client;
  }

  async withClient<T>(operation: (client: Client) => Promise<T>): Promise<T> {
    return this._withClient(operation);
  }

  async reconnect(): Promise<void> {
    return this._reconnect();
  }

  async ensureConnected(): Promise<void> {
    return this._ensureConnected();
  }

  static async create(config?: SftpStorageConfig) {
    const storage = new SftpStorageMock(config);
    await storage.ensureConnected();

    await storage.healthCheck();
    return storage;
  }
}

describe("SftpStorage", () => {
  let storage: SftpStorageMock;
  const VERSIONED_HASH =
    "0x01d5cc28986f58db309e0fae63b60ade81a01667721e190ec142051240b5d436";
  const BLOB_DATA =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  beforeAll(async () => {
    storage = await SftpStorageMock.create();

    return async () => {
      await storage.close();
    };
  });

  afterEach(async () => {
    // Clean up any spies
    vi.restoreAllMocks();
  });

  it("should create a storage", async () => {
    const sftpStorage = await SftpStorageMock.create();

    expect(sftpStorage.chainId).toBe(env.CHAIN_ID);
  });

  describe("when ensuring that the storage is connected", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectResult = {} as any;
    let sftpStorage: SftpStorageMock;

    beforeEach(async () => {
      sftpStorage = new SftpStorageMock();
    });

    afterEach(async () => {
      vi.restoreAllMocks();
    });

    it("should connect if the storage is not connected", async () => {
      const connectSpy = vi
        .spyOn(sftpStorage.client, "connect")
        .mockImplementation(async () => connectResult);

      expect(sftpStorage.isConnected).toBe(false);
      expect(sftpStorage.isConnecting).toBe(false);

      await sftpStorage.ensureConnected();

      expect(connectSpy).toHaveBeenCalledOnce();
      expect(sftpStorage.isConnected).toBe(true);
      expect(sftpStorage.isConnecting).toBe(false);
    });

    it("should not connect if the storage is already connected", async () => {
      await sftpStorage.ensureConnected();

      const connectSpy = vi
        .spyOn(sftpStorage.client, "connect")
        .mockImplementation(async () => connectResult);

      await sftpStorage.ensureConnected();

      expect(connectSpy).not.toHaveBeenCalled();
    });

    it("should not connect if the storage is already connecting", async () => {
      const connectSpy = vi
        .spyOn(sftpStorage.client, "connect")
        .mockImplementation(async () => connectResult);

      await Promise.all([
        sftpStorage.ensureConnected(),
        sftpStorage.ensureConnected(),
      ]);

      expect(connectSpy).toHaveBeenCalledOnce();
    });
  });

  describe("when storing a blob", () => {
    beforeEach(async () => {
      await storage.withClient(async (client) => {
        const blobUri = storage.getBlobUri(VERSIONED_HASH);
        const blobDirPath = blobUri.substring(0, blobUri.lastIndexOf("/"));
        if (await client.exists(blobUri)) {
          await client.rmdir(blobDirPath, true);
        }
      });
    });

    it("should return the correct blob uri", async () => {
      const expectedBlobUri = storage.getBlobUri(VERSIONED_HASH);
      const blobUri = await storage.storeBlob(VERSIONED_HASH, BLOB_DATA);

      expect(blobUri).toBe(expectedBlobUri);
    });

    it("should store it in the correct directory", async () => {
      const blobUri = await storage.storeBlob(VERSIONED_HASH, BLOB_DATA);

      await expect(storage.client.exists(blobUri)).resolves.toBe("-");
    });
  });

  it("should get a blob", async () => {
    const blobUri = await storage.storeBlob(VERSIONED_HASH, BLOB_DATA);

    const blob = await storage.getBlob(blobUri);

    expect(blob).toBe(BLOB_DATA);
  });

  it("should remove a blob", async () => {
    const blobUri = await storage.storeBlob(VERSIONED_HASH, BLOB_DATA);

    await storage.removeBlob(blobUri);

    await expect(storage.client.exists(blobUri)).resolves.toBe(false);
  });

  describe("when closing the storage", () => {
    it("should close the storage", async () => {
      await storage.close();

      expect(storage.isConnected).toBe(false);
    });

    it("should not close the storage if it is not connected", async () => {
      const notConnectedStorage = new SftpStorageMock();

      const endSpy = vi
        .spyOn(notConnectedStorage.client, "end")
        .mockImplementation(async () => true);

      await notConnectedStorage.close();

      expect(endSpy).not.toHaveBeenCalled();
    });

    it("should not throw an error if the disconnection fails", async () => {
      vi.spyOn(storage.client, "end").mockImplementation(async () => {
        throw new Error("Disconnection failed");
      });

      await expect(storage.close()).resolves.not.toThrow();
    });
  });

  describe("when health checking the storage", () => {
    it("should return 'OK' if the storage is healthy", async () => {
      await expect(storage.healthCheck()).resolves.toBe("OK");
    });
  });

  describe("when performing an operation with the client", () => {
    testValidError(
      "should throw an error if the operation fails after the retries",
      async () => {
        const reconnectStorage = await SftpStorageMock.create({
          ...SFTP_STORAGE_CONFIG,
          backoffConfig: {
            numOfAttempts: 1,
            startingDelay: 0,
          },
        });

        vi.spyOn(reconnectStorage.client, "exists").mockImplementation(() => {
          throw new Error("Connection failed");
        });

        await reconnectStorage.withClient(async (client) => {
          await client.exists(SFTP_STORAGE_CONFIG.path);
        });
      },
      Error
    );
  });
});
