import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

const DEFAULT_TIMEOUT_MS = 30_000;

const CID_PREFIX_PATTERN = /^(bafy|bafk|Qm)/;

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

export interface IpfsStorageConfig extends BlobStorageConfig {
  gatewayUrl: string;
  timeoutMs?: number;
}

export class IpfsStorage extends BlobStorage {
  protected readonly gatewayUrl: string;
  protected readonly timeoutMs: number;

  protected constructor({ chainId, gatewayUrl, timeoutMs }: IpfsStorageConfig) {
    super(BlobStorageName.IPFS, chainId);
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  protected async _healthCheck(): Promise<void> {
    // Any response (including 404) means the gateway is reachable;
    // network errors will throw automatically from fetch().
    await fetch(`${this.gatewayUrl}/ipfs/bafkqaaa`, {
      method: "HEAD",
      signal: AbortSignal.timeout(this.timeoutMs),
    });
  }

  protected async _getBlob(
    uri: string,
    { fileType }: GetBlobOpts = {}
  ): Promise<string> {
    if (!CID_PREFIX_PATTERN.test(uri)) {
      throw new Error(`Invalid IPFS CID: "${uri}"`);
    }

    const response = await fetch(`${this.gatewayUrl}/ipfs/${uri}`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const retryable = isRetryableStatus(response.status);
      throw new Error(
        `Failed to retrieve blob: ${response.status} ${response.statusText}${retryable ? " (retryable)" : ""}`
      );
    }

    const buffer = await response.arrayBuffer();

    return fileType === "text"
      ? new TextDecoder().decode(buffer)
      : bytesToHex(buffer);
  }

  protected async _storeBlob(_: string, __: Buffer): Promise<string> {
    throw new Error(
      '"storeBlob" is not supported: IPFS references are registered externally by blobscan-ipld'
    );
  }

  protected async _removeBlob(_: string): Promise<void> {
    throw new Error('"removeBlob" is not supported: IPFS content is immutable');
  }

  getBlobUri(versionedHash: string) {
    return versionedHash;
  }

  static async create(config: IpfsStorageConfig): Promise<IpfsStorage> {
    try {
      const storage = new IpfsStorage(config);

      await storage.healthCheck();

      return storage;
    } catch (err) {
      const err_ = err as Error;

      throw new StorageCreationError(
        this.name,
        err_.message,
        err_.cause as Error
      );
    }
  }
}
