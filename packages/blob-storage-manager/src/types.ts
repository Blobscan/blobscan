import type { $Enums } from "@blobscan/db";

import type { BlobStorageError } from "./errors";
import type {
  FileSystemStorage,
  GoogleStorage,
  PostgresStorage,
  SwarmStorage,
} from "./storages";

export type BlobStorageName = $Enums.BlobStorage;

export type StorageOf<N extends BlobStorageName> = N extends "GOOGLE"
  ? GoogleStorage
  : N extends "SWARM"
  ? SwarmStorage
  : N extends "POSTGRES"
  ? PostgresStorage
  : N extends "FILE_SYSTEM"
  ? FileSystemStorage
  : never;

export type BlobReference<N extends BlobStorageName = BlobStorageName> = {
  reference: string;
  storage: N;
};

export type StorageError<N extends BlobStorageName = BlobStorageName> = {
  storage: N;
  error: BlobStorageError;
};

export type Blob = {
  data: string;
  versionedHash: string;
};

export type StoreOptions = {
  selectedStorages: $Enums.BlobStorage[];
};
