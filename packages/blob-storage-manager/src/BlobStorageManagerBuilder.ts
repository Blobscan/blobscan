import { type BlobStorage } from "./BlobStorage";
import { BlobStorageManager, type BlobStorages } from "./BlobStorageManager";

export class BlobStorageManagerBuilder<
  SName extends string = never,
  T extends BlobStorages<SName> = { [k in SName]: never },
> {
  private constructor(
    private readonly blobStorages: T,
    private readonly chainId: number,
  ) {}

  static create(chainId: number): BlobStorageManagerBuilder {
    return new BlobStorageManagerBuilder({}, chainId);
  }

  addStorage<K extends string, V extends BlobStorage | null>(
    name: K,
    blobStorage: V,
  ): BlobStorageManagerBuilder<SName | K, T & { [k in K]: V }> {
    const nextStorage = { [name]: blobStorage } as { [k in K]: V };

    return new BlobStorageManagerBuilder(
      {
        ...this.blobStorages,
        ...nextStorage,
      },
      this.chainId,
    );
  }

  build(): BlobStorageManager<SName, T> {
    return new BlobStorageManager(this.blobStorages, this.chainId);
  }
}
