import type { BlobStorage as BlobStorageName } from "@blobscan/db";
import { api, SemanticAttributes } from "@blobscan/open-telemetry";

import type { BlobStorage } from "./BlobStorage";
import { BlobStorageError, BlobStorageManagerError } from "./errors";
import { tracer, updateBlobStorageMetrics } from "./instrumentation";
import type { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";

type Blob = {
  data: string;
  versionedHash: string;
};

export type StorageOf<T extends BlobStorageName> = T extends "GOOGLE"
  ? GoogleStorage
  : T extends "SWARM"
  ? SwarmStorage
  : T extends "POSTGRES"
  ? PostgresStorage
  : never;

export type BlobStorages<SNames extends BlobStorageName> = {
  [K in SNames]?: StorageOf<K>;
};

export type BlobReference<
  StorageName extends BlobStorageName = BlobStorageName
> = {
  reference: string;
  storage: StorageName;
};

export type StorageError<SName extends BlobStorageName = BlobStorageName> = {
  storage: SName;
  error: BlobStorageError;
};

export type StoreOptions = {
  selectedStorages: BlobStorageName[];
};

function calculateBlobBytes(blob: string): number {
  return blob.slice(2).length / 2;
}

export class BlobStorageManager<
  BSName extends BlobStorageName = BlobStorageName,
  T extends BlobStorages<BSName> = BlobStorages<BSName>
> {
  #blobStorages: T;
  chainId: number;

  constructor(blobStorages: T, chainId: number) {
    if (!Object.values(blobStorages).some((storage) => !!storage)) {
      throw new BlobStorageManagerError("No blob storages provided");
    }

    this.#blobStorages = blobStorages;
    this.chainId = chainId;
  }

  getStorage<SName extends keyof T>(name: SName): T[SName] {
    return this.#blobStorages[name];
  }

  hasStorage<SName extends keyof T>(name: SName): boolean {
    return !!this.#blobStorages[name];
  }

  async getBlob(
    ...blobReferences: BlobReference<BSName>[]
  ): Promise<{ data: string; storage: BSName } | null> {
    return tracer.startActiveSpan(
      "blob_storage_manager",
      {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "getBlob",
        },
      },
      async (span) => {
        const availableReferences = blobReferences.filter(
          ({ storage }) => this.#blobStorages[storage]
        );

        try {
          const blob = await Promise.any(
            availableReferences.map(({ reference, storage: storageName }) =>
              tracer.startActiveSpan(
                "blob_storage_manager:storage",
                {
                  attributes: {
                    storage: storageName,
                    [SemanticAttributes.CODE_FUNCTION]: "getBlob",
                  },
                },
                async (storageSpan) => {
                  const start = performance.now();
                  const blob = await (
                    this.#blobStorages[storageName] as BlobStorage
                  )
                    .getBlob(reference)
                    .then((data) => ({
                      data,
                      storage: storageName,
                    }));
                  const end = performance.now();

                  storageSpan.end();

                  updateBlobStorageMetrics({
                    storage: storageName,
                    blobSize: calculateBlobBytes(blob.data),
                    direction: "received",
                    duration: end - start,
                  });

                  return blob;
                }
              )
            )
          );

          span.end();

          return blob;
        } catch (e) {
          const message = "Failed to get blob from any of the storages";
          let err: BlobStorageManagerError;

          // Aggregate errors are thrown when all the promises fail
          if (e instanceof AggregateError) {
            err = new BlobStorageManagerError(message, {
              storageErrors: e.errors as BlobStorageError[],
            });
          } else {
            const e_ = e as Error;
            err = new BlobStorageManagerError(`${message}: ${e_}`);
          }

          span.setStatus({ code: api.SpanStatusCode.ERROR });
          span.recordException(err);

          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  async storeBlob(
    { data, versionedHash }: Blob,
    opts?: StoreOptions
  ): Promise<{
    references: BlobReference<BSName>[];
    errors: BlobStorageError[];
  }> {
    return tracer.startActiveSpan(
      "blob_storage_manager",
      {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "storeBlob",
        },
      },
      async (span) => {
        const selectedStorages = this.#getSelectedStorages(opts);

        const results = await Promise.allSettled(
          selectedStorages.map(([name, storage]) => {
            return tracer.startActiveSpan(
              "blob_storage_manager:storage",
              {
                attributes: {
                  storage: name,
                  [SemanticAttributes.CODE_FUNCTION]: "storeBlob",
                },
              },
              async (storageSpan) => {
                const start = performance.now();
                const blobReference = await storage
                  .storeBlob(this.chainId, versionedHash, data)
                  .then<BlobReference<BSName>>((reference) => ({
                    reference,
                    storage: name,
                  }));
                const end = performance.now();

                storageSpan.end();

                updateBlobStorageMetrics({
                  blobSize: calculateBlobBytes(data),
                  direction: "sent",
                  duration: end - start,
                  storage: name,
                });

                return blobReference;
              }
            );
          })
        );
        const references = results
          .filter(
            (res): res is PromiseFulfilledResult<BlobReference<BSName>> =>
              res.status === "fulfilled"
          )
          .map((res) => res.value);
        const storageErrors = results
          .filter((r) => r.status === "rejected")
          .map((r) => (r as PromiseRejectedResult).reason as BlobStorageError);

        if (!references.length) {
          const err = new BlobStorageManagerError(
            `Failed to upload blob "${versionedHash}" to any storage`,
            {
              storageErrors,
            }
          );

          span.setStatus({ code: api.SpanStatusCode.ERROR });
          span.recordException(err);
          throw err;
        }

        span.end();

        return {
          references,
          errors: storageErrors,
        };
      }
    );
  }

  #getSelectedStorages(
    { selectedStorages }: StoreOptions = { selectedStorages: [] }
  ): [BSName, BlobStorage][] {
    const uniqueInputStorageNames = Array.from(new Set(selectedStorages));
    const selectedStorageNames = uniqueInputStorageNames?.length
      ? uniqueInputStorageNames
      : // If no storages are provided, default to normal behaviour and use all the storages
        (Object.keys(this.#blobStorages) as BSName[]);

    const selectedAvailableStorages = Object.entries(this.#blobStorages).filter(
      ([name, storage]) =>
        selectedStorageNames.includes(name as BSName) && !!storage
    ) as [BSName, BlobStorage][];

    if (
      uniqueInputStorageNames.length &&
      selectedAvailableStorages.length !== uniqueInputStorageNames.length
    ) {
      const selectdAvailableStorageNames = selectedAvailableStorages.map(
        ([name]) => name
      );
      const missingStorageNames = uniqueInputStorageNames.filter(
        (storageName) =>
          !selectdAvailableStorageNames.includes(storageName as BSName)
      );

      throw new BlobStorageManagerError(
        `Some of the selected storages are not available: ${missingStorageNames.join(
          ", "
        )}"`
      );
    }

    return selectedAvailableStorages;
  }
}
