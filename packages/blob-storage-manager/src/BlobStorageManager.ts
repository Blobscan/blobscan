import type { BlobStorage as BlobStorageNames } from "@blobscan/db";

import type { BlobStorage } from "./BlobStorage";
import type { PrismaStorage, SwarmStorage } from "./storages";
import type { GoogleStorage } from "./storages";

export type StorageOf<T extends BlobStorageNames> = T extends "GOOGLE"
  ? GoogleStorage
  : T extends "SWARM"
  ? SwarmStorage
  : T extends "PRISMA"
  ? PrismaStorage
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

  async storeBlob({
    data,
    versionedHash,
  }: Blob): Promise<BlobReference<SNames>[]> {
    const availableStorages = Object.entries(this.#blobStorages).filter(
      ([, storage]) => storage
    ) as [SNames, BlobStorage][];
    const storageReferences = await Promise.all(
      availableStorages.map(([name, storage]) =>
        storage.storeBlob(this.chainId, versionedHash, data).then(
          (reference): BlobReference<SNames> => ({
            reference,
            storage: name,
          })
        )
      )
    );

    return storageReferences;
  }
}
