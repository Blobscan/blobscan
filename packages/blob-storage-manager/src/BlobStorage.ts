import type { Environment } from "./env";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlobStorageConfig {}

export abstract class BlobStorage {
  abstract healthCheck(): Promise<void>;
  abstract getBlob(uri: string): Promise<string>;
  abstract storeBlob(
    chainId: number,
    versionedHash: string,
    data: string
  ): Promise<string>;

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
      const err_ = err as Error;
      throw new Error(`${this.name} is not reachable: ${err_.message}`);
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
  ): Promise<T | undefined> {
    const config = this.tryGetConfigFromEnv(env);

    if (!config) {
      return;
    }

    const blobStorage = new this(config);

    try {
      await blobStorage.healthCheck();
    } catch (err) {
      const err_ = err as Error;
      throw new Error(`${this.name} is not reachable: ${err_.message}`);
    }

    return blobStorage;
  }

  protected static tryGetConfigFromEnv(
    _: Partial<Environment>
  ): BlobStorageConfig | undefined {
    throw new Error(`tryGetConfigFromEnv function not implemented`);
  }
}
