import type { Environment } from "./env";
import { BlobStorageError, StorageCreationError } from "./errors";
import type { BlobStorageName } from "./types";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlobStorageConfig {}

export abstract class BlobStorage {
  name: BlobStorageName;

  constructor(name: BlobStorageName) {
    this.name = name;
  }

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
        `Failed to get blob with uri "${uri}"`,
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
        `Failed to store blob with hash "${hash}"`,
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
      return [
        ,
        new StorageCreationError(
          this.name,
          "Failed to get config",
          err as Error
        ),
      ];
    }

    try {
      const blobStorage = new this(config);

      await blobStorage.healthCheck();

      return [blobStorage];
    } catch (err) {
      const err_ = err as Error;

      return [
        ,
        new StorageCreationError(this.name, err_.message, err_.cause as Error),
      ];
    }
  }

  protected static getConfigFromEnv(
    _: Partial<Environment>
  ): BlobStorageConfig | undefined {
    throw new BlobStorageError(
      this.name,
      `"getConfigFromEnv" function not implemented`
    );
  }
}
