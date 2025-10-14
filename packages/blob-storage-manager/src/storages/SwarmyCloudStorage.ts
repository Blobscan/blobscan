import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { logger } from "@blobscan/logger";

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

export const SWARMY_BASE_URL = "https://api.swarmy.cloud";
export const SWARMY_UPLOAD_URL = `${SWARMY_BASE_URL}/api/data/bin`;
export const SWARMY_FETCH_URL = `${SWARMY_BASE_URL}/files`;

export class SwarmyCloudStorage extends BlobStorage {
  protected readonly apiKey: string;

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
        `${SWARMY_FETCH_URL}/${uri}?k=${this.apiKey}`,
        {
          method: "GET",
        }
      );

      logger.debug("SwarmyCloud retrieve response", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to retrieve blob: ${response.status} ${response.statusText}`
        );
      }

      const buffer = await response.arrayBuffer();

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
      const base64Data = data.toString("base64");

      const response = await fetch(`${SWARMY_UPLOAD_URL}?k=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${hash}.bin`,
          contentType: "application/octet-stream",
          base64: base64Data,
        }),
      });

      logger.debug("SwarmyCloud upload response", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
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
