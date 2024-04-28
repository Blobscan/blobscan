import type { Environment } from "./env";
import { BlobStorageError, StorageCreationError } from "./errors";
import type { BlobStorageName } from "./types";

export interface BlobStorageConfig {
  chainId: number;
}

export abstract class BlobStorage {
  chainId: number;
  name: BlobStorageName;

  constructor(name: BlobStorageName, chainId: number) {
    this.name = name;
    this.chainId = chainId;
  }

  protected abstract _healthCheck(): Promise<void>;
  protected abstract _getBlob(uri: string): Promise<string>;
  protected abstract _storeBlob(hash: string, data: string): Promise<string>;
  protected abstract _removeBlob(uri: string): Promise<void>;

  abstract getBlobUri(hash: string): string | undefined;

  async healthCheck(): Promise<"OK"> {
    try {
      await this._healthCheck();

      return "OK";
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        "Storage is not reachable",
        err as Error
      );
    }
  }

  async getBlob(uri: string): Promise<string> {
    try {
      const blob = await this._getBlob(uri);

      return blob;
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        `Failed to get blob with uri "${uri}"`,
        err as Error
      );
    }
  }

  async removeBlob(uri: string): Promise<void> {
    try {
      await this._removeBlob(uri);
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        `Failed to remove blob with uri "${uri}"`,
        err as Error
      );
    }
  }

  async storeBlob(hash: string, data: string): Promise<string> {
    try {
      const res = await this._storeBlob(hash, data);

      return res;
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        `Failed to store blob with hash "${hash}"`,
        err as Error
      );
    }
  }

  static async create<T extends BlobStorage, C extends BlobStorageConfig>(
    this: new (config: C) => T,
    config: C
  ): Promise<T> {
    try {
      const blobStorage = new this(config);

      await blobStorage.healthCheck();

      return blobStorage;
    } catch (err) {
      const err_ = err as Error;
      throw new StorageCreationError(
        this.name,
        err_.message,
        err_.cause as Error
      );
    }
  }

  static async tryCreateFromEnv<
    C extends BlobStorageConfig,
    T extends BlobStorage
  >(
    this: {
      new (config: C): T;
      getConfigFromEnv(env: Partial<Environment>): C;
    },
    env: Partial<Environment>
  ): Promise<[T?, StorageCreationError?]> {
    let config: C;

    try {
      config = this.getConfigFromEnv(env);
    } catch (err) {
      const creationError = new StorageCreationError(
        this.name,
        "Failed to get config",
        err as Error
      );
      return [, creationError];
    }

    try {
      const blobStorage = new this(config);

      await blobStorage.healthCheck();

      return [blobStorage];
    } catch (err) {
      const err_ = err as Error;
      const creationError = new StorageCreationError(
        this.name,
        err_.message,
        err_.cause as Error
      );
      return [, creationError];
    }
  }

  protected static getConfigFromEnv(
    env: Partial<Environment>
  ): BlobStorageConfig {
    if (!env.CHAIN_ID) {
      throw new BlobStorageError(
        this.name,
        `No config variables found: no chain id provided`
      );
    }

    return {
      chainId: env.CHAIN_ID,
    };
  }
}
