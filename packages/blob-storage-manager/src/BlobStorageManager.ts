import type { BlobStorage as BlobStorageName } from "@blobscan/db";
import { api, SemanticAttributes } from "@blobscan/open-telemetry";

import type { BlobStorage } from "./BlobStorage";
import { updateBlobStorageMetrics } from "./instrumentation";
import { tracer } from "./instrumentation";
import type { PostgresStorage, SwarmStorage } from "./storages";
import type { GoogleStorage } from "./storages";

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
  error: Error;
};

export type StoreOptions = {
  storages: BlobStorageName[];
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
      throw new Error("No blob storages provided");
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
          const errorMessage = "Failed to get blob from any of the storages";

          if (e instanceof AggregateError) {
            const storageErrors = e.errors.map((err, i) => {
              /**
               * Aggregate errors are thrown when all the promises fail
               * so we can access the reference by index without worrying about having the
               * wrong storage name
               */
              const storageName =
                availableReferences[i]?.storage.toString() ?? "Unknown Storage";

              return `${storageName} - ${err}`;
            });

            throw new Error(`${errorMessage}: ${storageErrors.join(", ")}`);
          }

          const err = new Error(`${errorMessage}: ${e}`);

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
    errors: StorageError<BSName>[];
  }> {
    return tracer.startActiveSpan(
      "blob_storage_manager",
      {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "storeBlob",
        },
      },
      async (span) => {
        // If no storages are provided, use all the storages

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
        const errors = results.reduce<StorageError<BSName>[]>(
          (prevFailedUploads, res, i) => {
            const storage = selectedStorages[i] as [BSName, BlobStorage];

            if (res.status === "rejected") {
              const storageError = {
                error: res.reason,
                storage: storage[0],
              };
              return [...prevFailedUploads, storageError];
            }

            return prevFailedUploads;
          },
          []
        );
        const storageErrorMsgs = errors.map(
          (storageError) => `${storageError.storage}: ${storageError.error}`
        );

        if (!references.length) {
          const err = new Error(
            `Failed to upload blob ${versionedHash} to any of the storages: ${storageErrorMsgs.join(
              ", "
            )}`
          );

          span.setStatus({ code: api.SpanStatusCode.ERROR });
          span.recordException(err);
          throw err;
        }

        span.end();

        return {
          references,
          errors,
        };
      }
    );
  }

  #getSelectedStorages(
    { storages }: StoreOptions = { storages: [] }
  ): [BSName, BlobStorage][] {
    const selectedStorageNames = storages?.length
      ? storages
      : // If no storages are provided, use all the storages
        (Object.keys(this.#blobStorages) as BSName[]);

    return Object.entries(this.#blobStorages).filter(
      ([name, storage]) =>
        selectedStorageNames.includes(name as BSName) && !!storage
    ) as [BSName, BlobStorage][];
  }
}
