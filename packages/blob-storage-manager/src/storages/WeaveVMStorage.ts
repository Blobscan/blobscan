import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { z } from "@blobscan/zod";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";

const blobResponseSchema = z.object({
  blob_data: z.string(),
});

export interface WeaveVMStorageConfig extends BlobStorageConfig {
  apiBaseUrl: string;
}

export class WeaveVMStorage extends BlobStorage {
  apiBaseUrl: string;

  protected constructor({ apiBaseUrl, chainId }: WeaveVMStorageConfig) {
    super(BlobStorageName.WEAVEVM, chainId);

    this.apiBaseUrl = apiBaseUrl;
  }

  protected async _healthCheck(): Promise<void> {
    await fetch(`${this.apiBaseUrl}/v1/stats`);
  }

  protected async _getBlob(uri: string): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/v1/blob/${uri}`);
    const jsonRes = await response.json();

    const res = blobResponseSchema.safeParse(jsonRes);

    if (!res.success) {
      throw new Error("Failed to parse blob response", {
        cause: res.error.flatten().fieldErrors.blob_data?.join(";"),
      });
    }

    return res.data.blob_data;
  }

  protected async _storeBlob(_: string, __: Buffer): Promise<string> {
    throw new Error(
      '"_storeBlob" operation is not allowed for WeaveVM storage'
    );
  }

  protected _stageBlob(_: string, __: Buffer): Promise<string> {
    throw new Error(
      '"_stageBlob" operation is not allowed for WeaveVM storage'
    );
  }

  protected async _removeBlob(_: string): Promise<void> {
    throw new Error(
      '"_removeBlob" operation is not allowed for WeaveVM storage'
    );
  }

  getBlobUri(hash: string) {
    return hash;
  }

  static async create(config: WeaveVMStorageConfig) {
    try {
      const storage = new WeaveVMStorage(config);

      await storage.healthCheck();

      return storage;
    } catch (err) {
      const err_ = err as Error;

      throw new Error("Failed to create WeaveVM storage", {
        cause: err_,
      });
    }
  }
}
