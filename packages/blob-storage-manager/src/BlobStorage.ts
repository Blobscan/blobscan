import type { Environment } from "./env";
import { BlobStorageError, StorageCreationError } from "./errors";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlobStorageConfig {}

export abstract class BlobStorage {
  protected abstract _healthCheck(): Promise<void>;
  protected abstract _getBlob(uri: string): Promise<string>;
  protected abstract _storeBlob(
    chainId: number,
    hash: string,
    data: string
  ): Promise<string>;

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
        `Failed to get blob "${uri}"`,
        err as Error
      );
    }
  }

  async storeBlob(
    chainId: number,
    hash: string,
    data: string
  ): Promise<string> {
    try {
      const res = await this._storeBlob(chainId, hash, data);

      return res;
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        `Failed to store blob "${hash}"`,
        err as Error
      );
    }
  }

  protected buildBlobFileName(chainId: number, hash: string): string {
    return `${chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
  }

  static async create<T extends BlobStorage, C extends BlobStorageConfig>(
    this: new (config: C) => T,
    config: C
  ): Promise<T> {
    const blobStorage = new this(config);

    try {
      await blobStorage.healthCheck();
    } catch (err) {
      throw new StorageCreationError(
        this.name,
        "Healthcheck failed",
        err as BlobStorageError
      );
    }

    return blobStorage;
  }

  static async tryCreateFromEnv<
    C extends BlobStorageConfig,
    T extends BlobStorage
  >(
    this: {
      new (config: C): T;
      tryGetConfigFromEnv(env: Partial<Environment>): C | undefined;
    },
    env: Partial<Environment>
  ): Promise<[T?, StorageCreationError?]> {
    const config = this.tryGetConfigFromEnv(env);

    if (!config) {
      return [, new StorageCreationError(this.name, "No config found")];
    }

    const blobStorage = new this(config);

    try {
      await blobStorage.healthCheck();
    } catch (err) {
      return [, err as StorageCreationError];
    }

    return [blobStorage];
  }

  protected static tryGetConfigFromEnv(
    _: Partial<Environment>
  ): BlobStorageConfig | undefined {
    throw new StorageCreationError(
      this.name,
      `"tryGetConfigFromEnv" function not implemented`
    );
  }
}
