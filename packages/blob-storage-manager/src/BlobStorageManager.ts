import type { BlobStorage as BlobStorageNames } from "@blobscan/db";

import type { BlobStorage } from "./BlobStorage";
import type { PostgresStorage, SwarmStorage } from "./storages";
import type { GoogleStorage } from "./storages";

export type StorageOf<T extends BlobStorageNames> = T extends "GOOGLE"
  ? GoogleStorage
  : T extends "SWARM"
  ? SwarmStorage
  : T extends "POSTGRES"
  ? PostgresStorage
  : never;

export type BlobStorages<SNames extends BlobStorageNames> = {
  [K in SNames]?: StorageOf<K>;
};

export type BlobReference<
  StorageName extends BlobStorageNames = BlobStorageNames
> = {
  reference: string;
  storage: StorageName;
};

export type StorageError<SName extends BlobStorageNames = BlobStorageNames> = {
  storage: SName;
  error: Error;
};

type Blob = {
  data: string;
  versionedHash: string;
};

export class BlobStorageManager<
  SNames extends BlobStorageNames = BlobStorageNames,
  T extends BlobStorages<SNames> = BlobStorages<SNames>
> {
  #blobStorages: T;
  chainId: number;

  constructor(blobStorages: T, chainId: number) {
    if (!Object.values(blobStorages).some((storage) => !!storage)) {
      throw new Error("No blob storages provided");
    }

    this.#blobStorages = blobStorages;
    this.chainId = chainId;
  }

  getStorage<SName extends keyof T>(name: SName): T[SName] {
    return this.#blobStorages[name];
  }

  async getBlob(
    ...blobReferences: BlobReference<SNames>[]
  ): Promise<{ data: string; storage: SNames } | null> {
    const availableReferences = blobReferences.filter(
      ({ storage }) => this.#blobStorages[storage]
    );
    return Promise.any(
      availableReferences.map(({ reference, storage: storageName }) =>
        (this.#blobStorages[storageName] as BlobStorage)
          .getBlob(reference)
          .then((data) => ({
            data,
            storage: storageName,
          }))
      )
    );
  }

  async storeBlob({ data, versionedHash }: Blob): Promise<{
    references: BlobReference<SNames>[];
    errors: StorageError<SNames>[];
  }> {
    const availableStorages = Object.entries(this.#blobStorages).filter(
      ([, storage]) => storage
    ) as [SNames, BlobStorage][];
    const results = await Promise.allSettled(
      availableStorages.map(([name, storage]) =>
        storage.storeBlob(this.chainId, versionedHash, data).then(
          (reference): BlobReference<SNames> => ({
            reference,
            storage: name,
          })
        )
      )
    );

    const successfulUploads = results.filter(
      (res) => res.status === "fulfilled"
    ) as PromiseFulfilledResult<BlobReference<SNames>>[];
    const failedUploads = results.filter(
      (res) => res.status === "rejected"
    ) as PromiseRejectedResult[];
    const storageErrors = failedUploads.map<StorageError<SNames>>((res, i) => {
      const storage = availableStorages[i] as [SNames, BlobStorage];
      const storageName = storage[0];

      return {
        storage: storageName,
        error: res.reason,
      };
    });

    if (!successfulUploads.length) {
      throw new Error(
        `Failed to upload blob ${versionedHash} to any of the storages :\n${storageErrors.join(
          "\n"
        )}`
      );
    }

    return {
      references: successfulUploads.map((res) => res.value),
      errors: storageErrors,
    };
  }
}
