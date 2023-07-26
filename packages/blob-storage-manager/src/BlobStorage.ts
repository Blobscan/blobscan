import type { Environment } from "./env";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlobStorageOptions {}

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

  static async create<T extends BlobStorage, O extends BlobStorageOptions>(
    this: new (opts: O) => T,
    opts: O
  ): Promise<T> {
    const blobStorage = new this(opts);

    try {
      await blobStorage.healthCheck();
    } catch (err) {
      const err_ = err as Error;
      throw new Error(`${this.name} is not reachable: ${err_.message}`);
    }

    return blobStorage;
  }

  static async tryCreateFromEnv<
    O extends BlobStorageOptions,
    T extends BlobStorage
  >(
    this: {
      new (opts: O): T;
      tryGetOptsFromEnv(env: Environment): O | undefined;
    },
    env: Environment
  ): Promise<T | undefined> {
    const opts = this.tryGetOptsFromEnv(env);

    if (!opts) {
      return;
    }

    const blobStorage = new this(opts);

    try {
      await blobStorage.healthCheck();
    } catch (err) {
      const err_ = err as Error;
      throw new Error(`${this.name} is not reachable: ${err_.message}`);
    }

    return blobStorage;
  }

  protected static tryGetOptsFromEnv(
    _: Environment
  ): BlobStorageOptions | undefined {
    throw new Error(`tryGetOptsFromEnv function not implemented`);
  }
}
