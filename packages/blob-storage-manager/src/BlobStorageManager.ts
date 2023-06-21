import { type BlobStorage } from "./BlobStorage";

export type BlobStorages<StorageNames extends string> = {
  [K in StorageNames]: BlobStorage | null;
};

export type BlobReference<StorageNames extends string> = {
  reference: string;
  storage: StorageNames;
};

type Blob = {
  data: string;
  versionedHash: string;
};

export class BlobStorageManager<
  SName extends string,
  T extends BlobStorages<SName>,
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
    blobReferences: BlobReference<SName>[],
  ): Promise<{ data: string; storage: SName } | null> {
    const availableReferences = blobReferences.filter(
      ({ storage }) => this.#blobStorages[storage],
    );
    return Promise.race(
      availableReferences.map(({ reference, storage: storageName }) =>
        (this.#blobStorages[storageName] as BlobStorage)
          .getBlob(reference)
          .then((data) => ({
            data,
            storage: storageName,
          })),
      ),
    );
  }

  async storeBlob({
    data,
    versionedHash,
  }: Blob): Promise<Record<SName, string | undefined>> {
    const availableStorages = Object.entries(this.#blobStorages).filter(
      ([, storage]) => storage,
    ) as [SName, BlobStorage][];
    const namedBlobReferences = await Promise.all(
      availableStorages.map(([name, storage]) =>
        storage.storeBlob(this.chainId, versionedHash, data).then(
          (reference): BlobReference<SName> => ({
            reference,
            storage: name,
          }),
        ),
      ),
    );

    return namedBlobReferences.reduce<Record<SName, string>>(
      (references, namedReference) => ({
        ...references,
        [namedReference.storage]: namedReference.reference,
      }),
      {} as Record<SName, string>,
    );
  }
}
