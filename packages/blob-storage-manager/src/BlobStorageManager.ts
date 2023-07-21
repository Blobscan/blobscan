import type { BlobStorage as BlobStorageName } from "@blobscan/db";

import type { BlobStorage } from "./BlobStorage";

export type BlobStorages<StorageNames extends BlobStorageName> = {
  [K in StorageNames]: BlobStorage | null;
};

export type BlobReference<
  StorageName extends BlobStorageName = BlobStorageName
> = {
  reference: string;
  storage: StorageName;
};

type Blob = {
  data: string;
  versionedHash: string;
};

export class BlobStorageManager<
  SName extends BlobStorageName,
  T extends BlobStorages<SName>
> {
  #blobStorages: T;
  chainId: number;

  constructor(blobStorages: T, chainId: number) {
    this.#blobStorages = blobStorages;
    this.chainId = chainId;
  }

  getStorage(name: SName): BlobStorage | null {
    return this.#blobStorages[name];
  }

  async getBlob(
    ...blobReferences: BlobReference<SName>[]
  ): Promise<{ data: string; storage: SName } | null> {
    const availableReferences = blobReferences.filter(
      ({ storage }) => this.#blobStorages[storage]
    );
    return Promise.race(
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

  async storeBlob({
    data,
    versionedHash,
  }: Blob): Promise<BlobReference<SName>[]> {
    const availableStorages = Object.entries(this.#blobStorages).filter(
      ([, storage]) => storage
    ) as [SName, BlobStorage][];
    const storageReferences = await Promise.all(
      availableStorages.map(([name, storage]) =>
        storage.storeBlob(this.chainId, versionedHash, data).then(
          (reference): BlobReference<SName> => ({
            reference,
            storage: name,
          })
        )
      )
    );

    return storageReferences;
  }
}
