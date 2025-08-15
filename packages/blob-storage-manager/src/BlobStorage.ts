import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { BlobStorageError } from "./errors";
import type { BlobFileType } from "./types";
import { getBlobFileType, normalizeBlobData } from "./utils/blob";

export interface BlobStorageConfig {
  chainId: number;
}

export interface GetBlobOpts {
  fileType?: BlobFileType;
}

export const STAGING_BLOB_URI_PREFIX = "staging-blobs";

export abstract class BlobStorage {
  constructor(readonly name: BlobStorageName, readonly chainId: number) {}

  protected abstract _healthCheck(): Promise<void>;
  protected abstract _getBlob(uri: string, opts?: GetBlobOpts): Promise<string>;
  protected abstract _storeBlob(hash: string, data: Buffer): Promise<string>;
  protected abstract _stageBlob(hash: string, data: Buffer): Promise<string>;
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
      const fileType = getBlobFileType(uri);
      const blob = await this._getBlob(uri, { fileType });

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

  async storeBlob(hash: string, data: string | Buffer): Promise<string> {
    try {
      const normalizedData = normalizeBlobData(data);

      const uri = await this._storeBlob(hash, normalizedData);

      return uri;
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        `Failed to store blob with hash "${hash}"`,
        err as Error
      );
    }
  }

  async stageBlob(hash: string, data: string | Buffer): Promise<string> {
    try {
      const normalizedData = normalizeBlobData(data);

      const uri = await this._stageBlob(hash, normalizedData);

      return uri;
    } catch (err) {
      throw new BlobStorageError(
        this.constructor.name,
        `Failed to stage blob with hash "${hash}"`,
        err as Error
      );
    }
  }
}
