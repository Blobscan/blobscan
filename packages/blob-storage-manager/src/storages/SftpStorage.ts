import Client from "ssh2-sftp-client";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

export interface SftpStorageConfig extends BlobStorageConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  path: string;
}

export class SftpStorage extends BlobStorage {
  protected _client: Client;
  protected _config: SftpStorageConfig;

  protected constructor(config: SftpStorageConfig) {
    super(BlobStorageName.SFTP, config.chainId);
    this._config = config;
    this._client = new Client();
  }

  protected async _withClient<T>(
    operation: (client: Client) => Promise<T>
  ): Promise<T> {
    try {
      await this._client.connect({
        host: this._config.host,
        port: this._config.port || 22,
        username: this._config.username,
        password: this._config.password,
        privateKey: this._config.privateKey,
      });

      const result = await operation(this._client);
      return result;
    } finally {
      try {
        await this._client.end();
      } catch {
        // Ignore disconnection errors
      }
    }
  }

  protected async _healthCheck(): Promise<void> {
    try {
      await this._withClient(async (client) => {
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

  protected async _getBlob(
    uri: string,
    { fileType }: GetBlobOpts
  ): Promise<string> {
    const fullPath = `${this._config.path}/${uri}`;

    const buffer = await this._withClient(async (client) => {
      return (await client.get(fullPath)) as Buffer;
    });

    return fileType === "text" ? buffer.toString() : bytesToHex(buffer);
  }

  protected async _removeBlob(uri: string): Promise<void> {
    const fullPath = `${this._config.path}/${uri}`;

    await this._withClient(async (client) => {
      await client.delete(fullPath);
    });
  }

  protected async _storeBlob(
    versionedHash: string,
    data: Buffer
  ): Promise<string> {
    const blobUri = this.getBlobUri(versionedHash);
    const fullPath = `${this._config.path}/${blobUri}`;
    const remoteDir = fullPath.substring(0, fullPath.lastIndexOf("/"));

    await this._withClient(async (client) => {
      const exists = await client.exists(remoteDir);
      if (!exists) {
        await client.mkdir(remoteDir, true);
      }
      await client.put(data, fullPath);
    });

    return blobUri;
  }

  getBlobUri(hash: string): string {
    return `${this.chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.bin`;
  }

  static async create(config: SftpStorageConfig) {
    try {
      const storage = new SftpStorage(config);
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
