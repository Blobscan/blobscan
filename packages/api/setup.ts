import { beforeAll } from "vitest";

import { GoogleStorage } from "@blobscan/blob-storage-manager";
import { fixtures } from "@blobscan/test";

import { env } from "./src/env";

class DeletableGoogleStorage extends GoogleStorage {
  async deleteBlob(chainId: number, versionedHash: string) {
    const fileName = this.buildBlobFileName(chainId, versionedHash);

    await this._storageClient.bucket(this._bucketName).file(fileName).delete();
  }
}

beforeAll(async () => {
  const [googleStorage] = await DeletableGoogleStorage.tryCreateFromEnv(env);

  if (googleStorage) {
    await Promise.all(
      fixtures.googleBlobData.map(({ versionedHash, data }) =>
        googleStorage
          ? googleStorage.storeBlob(env.CHAIN_ID, versionedHash, data)
          : Promise.resolve()
      )
    );
  }

  return async () => {
    await Promise.all(
      fixtures.googleBlobData.map(({ versionedHash, data }) =>
        googleStorage
          ? googleStorage.storeBlob(env.CHAIN_ID, versionedHash, data)
          : Promise.resolve()
      )
    );
  };
});
