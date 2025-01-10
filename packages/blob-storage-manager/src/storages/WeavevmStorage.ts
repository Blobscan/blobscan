import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";

const blobResponseSchema = z.object({
  blob_data: z.string(),
});

export interface WeavevmStorageConfig extends BlobStorageConfig {
  endpointBaseUrl: string;
}

export class WeavevmStorage extends BlobStorage {
  endpointBaseUrl: string;

  protected constructor({ endpointBaseUrl, chainId }: WeavevmStorageConfig) {
    super(BlobStorageName.WEAVEVM, chainId);

    this.endpointBaseUrl = endpointBaseUrl;
  }

  protected async _healthCheck(): Promise<void> {
    await fetch(`${this.endpointBaseUrl}/v1/stats`);
  }

  protected async _getBlob(uri: string): Promise<string> {
    const response = await fetch(`${this.endpointBaseUrl}/v1/blob/${uri}`);
    const jsonRes = await response.json();

    const res = blobResponseSchema.safeParse(jsonRes);

    if (!res.success) {
      throw new Error("Failed to parse blob response", {
        cause: res.error.flatten().fieldErrors.blob_data?.join(";"),
      });
    }

    return res.data.blob_data;
  }

  protected async _storeBlob(_: string, __: string): Promise<string> {
    throw new Error(
      "Blob storage operation is not allowed for Weavevm storage"
    );
  }

  protected async _removeBlob(_: string): Promise<void> {
    throw new Error(
      "Blob removal operation is not allowed for Weavevm storage"
    );
  }

  getBlobUri(hash: string) {
    return hash;
  }

  static async create(config: WeavevmStorageConfig) {
    try {
      const storage = new WeavevmStorage(config);

      await storage.healthCheck();

      return storage;
    } catch (err) {
      const err_ = err as Error;

      throw new Error("Failed to create Weavevm storage", {
        cause: err_,
      });
    }
  }
}
