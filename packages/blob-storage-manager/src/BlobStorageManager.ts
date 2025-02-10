import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { api, SemanticAttributes } from "@blobscan/open-telemetry";

import type { BlobStorage } from "./BlobStorage";
import { BlobStorageManagerError } from "./errors";
import type { BlobStorageError } from "./errors";
import { tracer, updateBlobStorageMetrics } from "./instrumentation";
import type { Blob, BlobReference, StorageOf, StoreOptions } from "./types";
import { calculateBlobBytes, removeDuplicatedStorages } from "./utils";

type GetBlobOperation = [BlobStorageName, () => Promise<string>];
export class BlobStorageManager {
  #blobStorages: BlobStorage[];

  constructor(blobStorages: BlobStorage[]) {
    if (!blobStorages.length) {
      throw new BlobStorageManagerError("No blob storages provided");
    }

    this.#blobStorages = removeDuplicatedStorages(blobStorages);
  }

  addStorage(storage: BlobStorage) {
    if (!this.hasStorage(storage.name)) {
      this.#blobStorages.push(storage);
    }
  }

  getAllStorages(): BlobStorage[] {
    return this.#blobStorages;
  }

  getStorage<T extends BlobStorageName>(name: T): StorageOf<T> | undefined {
    const blobStorage = this.#blobStorages.find(
      (storage): storage is StorageOf<T> => storage.name === name
    );

    return blobStorage as StorageOf<T> | undefined;
  }

  hasStorage<T extends BlobStorageName>(name: T): boolean {
    return !!this.getStorage(name);
  }

  removeStorage(storageName: BlobStorageName) {
    this.#blobStorages = this.#blobStorages.filter(
      (storage) => storage.name !== storageName
    );
  }

  async getBlobByReferences(
    ...blobReferences: BlobReference<BlobStorageName>[]
  ): Promise<{ data: string; storage: BlobStorageName }> {
    const supportedReferences = blobReferences.filter(({ storage }) =>
      this.hasStorage(storage)
    );

    if (!supportedReferences.length) {
      throw new BlobStorageManagerError(
        "No storage supported for the provided references"
      );
    }

    const getBlobOperations = supportedReferences
      .map<GetBlobOperation | undefined>(
        ({ reference, storage: storageName }) => {
          const storage = this.getStorage(storageName);

          if (!storage) {
            return;
          }

          const getBlobFn = () => storage.getBlob(reference);

          return [storageName, getBlobFn];
        }
      )
      .filter((op): op is GetBlobOperation => !!op);

    return this.#getBlob(getBlobOperations);
  }

  async getBlobByHash(hash: string) {
    const operations = this.#blobStorages
      .map<GetBlobOperation | undefined>((storage) => {
        const blobUri = storage.getBlobUri(hash);

        if (!blobUri) {
          return;
        }

        return [storage.name, () => storage.getBlob(blobUri)];
      })
      .filter((op): op is GetBlobOperation => !!op);

    if (!operations.length) {
      throw new BlobStorageManagerError(
        `No storage supported that can get the blob by its hash`
      );
    }

    return this.#getBlob(operations);
  }

  async storeBlob({ data, versionedHash }: Blob): Promise<{
    references: BlobReference<BlobStorageName>[];
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
        const results = await Promise.allSettled(
          this.#blobStorages.map((storage) => {
            return tracer.startActiveSpan(
              "blob_storage_manager:storage",
              {
                attributes: {
                  storage: storage.name,
                  [SemanticAttributes.CODE_FUNCTION]: "storeBlob",
                },
              },
              async (storageSpan) => {
                const start = performance.now();
                const blobReference = await storage
                  .storeBlob(versionedHash, data)
                  .then<BlobReference<BlobStorageName>>((reference) => ({
                    reference,
                    storage: storage.name,
                  }));
                const end = performance.now();

                storageSpan.end();

                updateBlobStorageMetrics({
                  blobSize: calculateBlobBytes(data),
                  direction: "sent",
                  duration: end - start,
                  storage: storage.name,
                });

                return blobReference;
              }
            );
          })
        );
        const references = results
          .filter(
            (
              res
            ): res is PromiseFulfilledResult<BlobReference<BlobStorageName>> =>
              res.status === "fulfilled"
          )
          .map((res) => res.value);
        const storageErrors = results
          .filter((r) => r.status === "rejected")
          .map((r) => (r as PromiseRejectedResult).reason as BlobStorageError);

        if (!references.length) {
          const err = new BlobStorageManagerError(
            `Failed to upload blob with hash "${versionedHash}" to any storage`,
            storageErrors
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

  async #getBlob(operations: GetBlobOperation[]) {
    return tracer.startActiveSpan(
      "blob_storage_manager",
      {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "getBlob",
        },
      },
      async (span) => {
        try {
          const blob = await Promise.any(
            operations.map(([storageName, getBlobFn]) =>
              tracer.startActiveSpan(
                "blob_storage_manager:storage",
                {
                  attributes: {
                    storage: storageName,
                  },
                },
                async (storageSpan) => {
                  const start = performance.now();

                  const blobData = await getBlobFn();

                  const end = performance.now();

                  storageSpan.end();

                  updateBlobStorageMetrics({
                    storage: storageName,
                    blobSize: calculateBlobBytes(blobData),
                    direction: "received",
                    duration: end - start,
                  });

                  return {
                    storage: storageName,
                    data: blobData,
                  };
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
            err = new BlobStorageManagerError(
              message,
              e.errors as BlobStorageError[]
            );
          } else {
            err = new BlobStorageManagerError(message, e as Error);
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

  #getSelectedStorages(
    { selectedStorages }: StoreOptions = { selectedStorages: [] }
  ): BlobStorage[] {
    const uniqueInputStorageNames = Array.from(new Set(selectedStorages));
    const selectedAvailableStorages = uniqueInputStorageNames.length
      ? this.#blobStorages.filter((s) =>
          uniqueInputStorageNames.includes(s.name)
        )
      : // Use all available storages if none are selected
        this.#blobStorages;

    if (
      uniqueInputStorageNames.length &&
      selectedAvailableStorages.length !== uniqueInputStorageNames.length
    ) {
      const selectedAvailableStorageNames = selectedAvailableStorages.map(
        (s) => s.name
      );
      const missingStorageNames = uniqueInputStorageNames.filter(
        (storageName) => !selectedAvailableStorageNames.includes(storageName)
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
