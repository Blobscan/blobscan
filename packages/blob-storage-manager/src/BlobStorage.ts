import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { BlobStorageError, BlobTooLargeError, IpfsGatewayError, InvalidBlobCidError } from "./errors";
import type { BlobFileType } from "./types";
import { getBlobFileType, normalizeBlobData } from "./utils/blob";

export interface BlobStorageConfig {
  chainId: number;
  signedUrlsEnabled?: boolean;
}

// Number of extra attempts after the first one when probing reachability at
// startup. A transient network blip (e.g. a premature close while fetching a
// GCS auth token) shouldn't abort boot.
const HEALTH_CHECK_MAX_RETRIES = 3;
const HEALTH_CHECK_RETRY_BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GetBlobOpts {
  fileType?: BlobFileType;
}

export interface GetSignedUrlOpts {
  expirationSeconds?: number;
}

export abstract class BlobStorage {
  readonly signedUrlsEnabled: boolean;

  constructor(
    readonly name: BlobStorageName,
    readonly chainId: number,
    opts: { signedUrlsEnabled?: boolean } = {}
  ) {
    this.signedUrlsEnabled = opts.signedUrlsEnabled ?? false;
  }

  protected abstract _healthCheck(): Promise<void>;
  protected abstract _getBlob(uri: string, opts?: GetBlobOpts): Promise<string>;
  protected abstract _storeBlob(hash: string, data: Buffer): Promise<string>;
  protected abstract _removeBlob(uri: string): Promise<void>;

  protected async _getSignedUrl(
    _reference: string,
    _opts?: GetSignedUrlOpts
  ): Promise<string | undefined> {
    return undefined;
  }

  protected async healthCheck(): Promise<"OK"> {
    let lastErr: unknown;

    for (let attempt = 0; attempt <= HEALTH_CHECK_MAX_RETRIES; attempt++) {
      try {
        await this._healthCheck();

        return "OK";
      } catch (err) {
        lastErr = err;

        if (attempt >= HEALTH_CHECK_MAX_RETRIES) {
          break;
        }

        // Exponential backoff with jitter so transient network failures
        // (timeouts, premature connection closes) get a few chances before
        // we declare the storage unreachable.
        const backoffMs =
          HEALTH_CHECK_RETRY_BASE_DELAY_MS *
          2 ** attempt *
          (0.5 + Math.random() * 0.5);

        await sleep(backoffMs);
      }
    }

    throw new Error("Storage is not reachable", {
      cause: lastErr as Error,
    });
  }

  async getBlob(uri: string): Promise<string> {
    try {
      const fileType = getBlobFileType(uri);
      const blob = await this._getBlob(uri, { fileType });

      return blob;
    } catch (err) {
      if (
        err instanceof BlobTooLargeError ||
        err instanceof InvalidBlobCidError ||
        err instanceof IpfsGatewayError
      )
        throw err;
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

  getBlobUri(versionedHash: string): string {
    throw new BlobStorageError(
      this.constructor.name,
      `Failed to get blob uri for blob with versioned hash "${versionedHash}"`,
      new Error(`"getBlobUri" not implemented`)
    );
  }

  async getSignedUrl(
    reference: string,
    opts?: GetSignedUrlOpts
  ): Promise<string | undefined> {
    if (!this.signedUrlsEnabled) return undefined;
    return this._getSignedUrl(reference, opts);
  }
}
