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

/**
 * Per-blob beacon/execution metadata that some storages (e.g. IPFS) require
 * beyond the raw bytes. It is optional at the storage interface because most
 * backends only need `{ hash, data }`; the indexer always supplies it.
 */
export type BlobContext = {
  commitment: string;
  txHash: string;
  /** Blob index within the transaction (0-based). */
  index: number;
  slot: number;
  epoch: number;
  blockNumber: number;
  blockHash: string;
};

export type Blob = {
  data: string;
  versionedHash: string;
  context?: BlobContext;
};

export type StoreOptions = {
  selectedStorages: BlobStorage[];
};

export type HexString = `0x${string}`;

export type BlobFileType = "text" | "binary";
