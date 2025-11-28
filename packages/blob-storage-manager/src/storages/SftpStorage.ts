import { backOff } from "exponential-backoff";
import Client from "ssh2-sftp-client";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

function isConnectionError(error: Error): boolean {
  return (
    error.message.includes("Not connected") ||
    error.message.includes("Connection closed") ||
    error.message.includes("ECONNRESET") ||
    error.message.includes("ETIMEDOUT") ||
    error.message.includes("ECONNREFUSED")
  );
}
export interface SftpStorageConfig extends BlobStorageConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  path: string;
  backoffConfig?: BackoffConfig;
}

export interface BackoffConfig {
  numOfAttempts?: number;
  startingDelay?: number;
}

export class SftpStorage extends BlobStorage {
  protected _client: Client;
  protected _config: SftpStorageConfig;
  protected _isConnected = false;
  protected _isConnecting = false;
  protected _connectionPromise: Promise<void> | null = null;

  protected constructor(config: SftpStorageConfig) {
    super(BlobStorageName.SFTP, config.chainId);

    this._config = config;
    this._client = new Client();

    // Listen for connection errors to mark as disconnected
    this._client.on("error", () => {
      this._isConnected = false;
    });
  }

  protected async _ensureConnected(): Promise<void> {
    // If already connected, return immediately
    if (this._isConnected) {
      return;
    }

    // If connection is in progress, wait for it
    if (this._isConnecting && this._connectionPromise) {
      await this._connectionPromise;

      return;
    }

    // Start new connection
    this._isConnecting = true;
    this._connectionPromise = this._connect();

    try {
      await this._connectionPromise;
    } finally {
      this._isConnecting = false;
      this._connectionPromise = null;
    }
  }

  protected async _connect(): Promise<void> {
    try {
      await this._client.connect({
        host: this._config.host,
        port: this._config.port || 22,
        username: this._config.username,
        password: this._config.password,
        privateKey: this._config.privateKey,
      });

      this._isConnected = true;
    } catch (err) {
      this._isConnected = false;
      throw err;
    }
  }

  protected async _reconnect(): Promise<void> {
    try {
      await this._client.end();
    } catch (err) {
      // Ignore disconnection errors
    }

    this._isConnected = false;
    await this._connect();
  }

  protected async _withClient<T>(
    operation: (client: Client) => Promise<T>
  ): Promise<T> {
    const { numOfAttempts = 5, startingDelay = 1000 } =
      this._config.backoffConfig || {};

    await this._ensureConnected();

    return backOff(
      async () => {
        try {
          return await operation(this._client);
        } catch (err) {
          const error = err as Error;

          if (isConnectionError(error)) {
            await this._reconnect();
          }

          throw err;
        }
      },
      {
        numOfAttempts,
        startingDelay,
        retry: (error: Error) => {
          return isConnectionError(error);
        },
      }
    );
  }

  protected async _healthCheck(): Promise<void> {
    try {
      await this._withClient(async (client) => {
        // List the root directory to ensure SFTP connection is alive
        const exists = await client.exists(this._config.path);

        if (!exists) {
          await client.mkdir(this._config.path, true);
        }
      });
    } catch (err) {
      throw new Error(`SFTP storage check failed: ${(err as Error).message}`, {
        cause: err,
      });
    }
  }

  protected async _getBlob(uri: string, _: GetBlobOpts): Promise<string> {
    const buffer = await this._withClient(async (client) => {
      return (await client.get(uri)) as Buffer;
    });

    return bytesToHex(buffer);
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this._withClient(async (client) => {
      await client.delete(uri);
    });
  }

  protected isConnectionError(error: Error): boolean {
    return (
      error.message.includes("Not connected") ||
      error.message.includes("Connection closed") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ECONNREFUSED")
    );
  }

  protected async _storeBlob(
    versionedHash: string,
    data: Buffer
  ): Promise<string> {
    const blobUri = this.getBlobUri(versionedHash);
    const blobDirPath = blobUri.substring(0, blobUri.lastIndexOf("/"));

    await this._withClient(async (client) => {
      const exists = await client.exists(blobDirPath);

      if (!exists) {
        await client.mkdir(blobDirPath, true);
      }

      await client.put(data, blobUri);
    });

    return blobUri;
  }

  async close(): Promise<void> {
    if (!this._isConnected) {
      return;
    }

    try {
      await this._client.end();
    } catch {
      // Ignore disconnection errors
    }

    this._isConnected = false;
  }

  getBlobUri(hash: string): string {
    return `${this._config.path}/${this.chainId.toString()}/${hash.slice(
      2,
      4
    )}/${hash.slice(4, 6)}/${hash.slice(6, 8)}/${hash.slice(2)}.bin`;
  }

  static async create(config: SftpStorageConfig) {
    try {
      const storage = new SftpStorage(config);

      await storage._ensureConnected();
      await storage.healthCheck();

      return storage;
    } catch (err) {
      const err_ = err as Error;

      throw new StorageCreationError(
        BlobStorageName.SFTP,
        err_.message,
        err_.cause as Error
      );
    }
  }
}
