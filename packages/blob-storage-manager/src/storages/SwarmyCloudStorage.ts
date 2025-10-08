import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

export interface SwarmyCloudStorageConfig extends BlobStorageConfig {
  apiKey: string;
}

interface SwarmyCloudUploadResponse {
  id: number;
  swarmReference: string;
}

export class SwarmyCloudStorage extends BlobStorage {
  private readonly apiKey: string;
  private readonly uploadUrl = "https://api.swarmy.cloud/api/data/bin";

  protected constructor({ chainId, apiKey }: SwarmyCloudStorageConfig) {
    super(BlobStorageName.SWARMYCLOUD, chainId);
    this.apiKey = apiKey;
  }

  protected async _healthCheck(): Promise<void> {
    // No health check implementation for SwarmyCloud
  }

  protected async _getBlob(
    uri: string,
    { fileType }: GetBlobOpts = {}
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://api.swarmy.cloud/files/${uri}?k=${this.apiKey}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to retrieve blob: ${response.status} ${response.statusText}`
        );
      }

      const buffer = await response.arrayBuffer();
      const dataBuffer = Buffer.from(buffer);
      return fileType === "text" ? buffer.toString() : bytesToHex(buffer);
    } catch (err) {
      throw new Error(
        `Failed to get blob from SwarmyCloud: ${(err as Error).message}`,
        {
          cause: err,
        }
      );
    }
  }

  protected async _storeBlob(hash: string, data: Buffer): Promise<string> {
    try {
      const blobUri = this.getBlobUri(hash);
      const base64Data = data.toString("base64");

      const response = await fetch(`${this.uploadUrl}?k=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${blobUri}.bin`,
          contentType: "application/octet-stream",
          base64: base64Data,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to upload blob: ${response.status} ${response.statusText}`
        );
      }

      const result: SwarmyCloudUploadResponse = await response.json();

      if (!result.swarmReference) {
        throw new Error("SwarmyCloud API error: No swarmReference returned");
      }

      return result.swarmReference;
    } catch (err) {
      throw new Error(
        `Failed to store blob in SwarmyCloud: ${(err as Error).message}`,
        {
          cause: err,
        }
      );
    }
  }

  protected async _removeBlob(_uri: string): Promise<void> {
    throw new Error(
      "Remove blob operation not supported by SwarmyCloud storage"
    );
  }

  getBlobUri(hash: string): string {
    // For SwarmyCloud, we can't predict the swarmReference beforehand
    // This method is kept for compatibility but the actual URI will be the swarmReference
    // returned from the upload operation
    return `${this.chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}`;
  }

  static async create(
    config: SwarmyCloudStorageConfig
  ): Promise<SwarmyCloudStorage> {
    try {
      const storage = new SwarmyCloudStorage(config);

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
