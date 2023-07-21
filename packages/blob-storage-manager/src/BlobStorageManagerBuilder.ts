import type { BlobStorage as BlobStorageName } from "@blobscan/db";

import type { BlobStorage } from "./BlobStorage";
import { BlobStorageManager } from "./BlobStorageManager";
import type { BlobStorages } from "./BlobStorageManager";
import type { GoogleStorage, SwarmStorage } from "./storages";
import type { PrismaStorage } from "./storages/PrismaStorage";

type StorageOf<T extends BlobStorageName> = T extends "GOOGLE"
  ? GoogleStorage
  : T extends "SWARM"
  ? SwarmStorage
  : T extends "PRISMA"
  ? PrismaStorage
  : never;

export class BlobStorageManagerBuilder<
  SName extends BlobStorageName = never,
  T extends BlobStorages<SName> = { [k in SName]: never }
> {
  private constructor(
    private readonly blobStorages: T,
    private readonly chainId: number
  ) {}

  static create(chainId: number): BlobStorageManagerBuilder {
    return new BlobStorageManagerBuilder({}, chainId);
  }

  addStorage<K extends BlobStorageName, V extends BlobStorage | null>(
    name: K,
    blobStorage: StorageOf<K> | null
  ): BlobStorageManagerBuilder<SName | K, T & { [k in K]: V }> {
    const nextStorage = { [name]: blobStorage } as { [k in K]: V };

    return new BlobStorageManagerBuilder(
      {
        ...this.blobStorages,
        ...nextStorage,
      },
      this.chainId
    );
  }

  build(): BlobStorageManager<SName, T> {
    return new BlobStorageManager(this.blobStorages, this.chainId);
  }
}
