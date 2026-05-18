import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

export interface IpfsStorageConfig extends BlobStorageConfig {
  gatewayUrl: string;
}

export class IpfsStorage extends BlobStorage {
  protected readonly gatewayUrl: string;

  protected constructor({ chainId, gatewayUrl }: IpfsStorageConfig) {
    super(BlobStorageName.IPFS, chainId);
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
  }

  protected async _healthCheck(): Promise<void> {
    const response = await fetch(`${this.gatewayUrl}/ipfs/bafkqaaa`, {
      method: "HEAD",
    });
    // Any response (including 404) means the gateway is reachable.
    if (response.status === 0) {
      throw new Error("IPFS gateway unreachable");
    }
  }

  protected async _getBlob(
    uri: string,
    { fileType }: GetBlobOpts = {}
  ): Promise<string> {
    const response = await fetch(`${this.gatewayUrl}/ipfs/${uri}`);

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve blob: ${response.status} ${response.statusText}`
      );
    }

    const buffer = await response.arrayBuffer();

    return fileType === "text" ? Buffer.from(buffer).toString() : bytesToHex(buffer);
  }

  protected async _storeBlob(_: string, __: Buffer): Promise<string> {
    throw new Error(
      '"storeBlob" is not supported: IPFS references are registered externally by blobscan-ipld'
    );
  }

  protected async _removeBlob(_: string): Promise<void> {
    throw new Error('"removeBlob" is not supported: IPFS content is immutable');
  }

  getBlobUri(dataCid: string) {
    return dataCid;
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
