import type { BlobStorage } from "@blobscan/db/prisma/enums";

import type { BlobStorageError } from "./errors";
import type { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";

export type StorageOf<N extends BlobStorage> = N extends "GOOGLE"
  ? GoogleStorage
  : N extends "SWARM"
  ? SwarmStorage
  : N extends "POSTGRES"
  ? PostgresStorage
  : never;

export type BlobReference<N extends BlobStorage = BlobStorage> = {
  reference: string;
  storage: N;
};

export type StorageError<N extends BlobStorage = BlobStorage> = {
  storage: N;
  error: BlobStorageError;
};

export type Blob = {
  data: string;
  versionedHash: string;
};

export type StoreOptions = {
  selectedStorages: BlobStorage[];
};

export type HexString = `0x${string}`;

export type BlobFileType = "text" | "binary";
