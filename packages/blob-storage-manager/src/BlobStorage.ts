import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { BlobStorageError } from "./errors";

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

  protected async healthCheck(): Promise<"OK"> {
    try {
      await this._healthCheck();

      return "OK";
    } catch (err) {
      throw new Error("Storage is not reachable", {
        cause: err as Error,
      });
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
}
