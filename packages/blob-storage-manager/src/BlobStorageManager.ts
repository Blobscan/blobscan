import { api, SemanticAttributes } from "@blobscan/open-telemetry";

import type { BlobStorage } from "./BlobStorage";
import { BlobStorageManagerError } from "./errors";
import type { BlobStorageError } from "./errors";
import { tracer, updateBlobStorageMetrics } from "./instrumentation";
import type {
  Blob,
  BlobReference,
  BlobStorageName,
  StorageOf,
  StoreOptions,
} from "./types";
import { calculateBlobBytes, removeDuplicatedStorages } from "./utils";

export class BlobStorageManager {
  #blobStorages: BlobStorage[];
  chainId: number;

  constructor(blobStorages: BlobStorage[], chainId: number) {
    if (!blobStorages.length) {
      throw new BlobStorageManagerError("No blob storages provided");
    }

    this.#blobStorages = removeDuplicatedStorages(blobStorages);
    this.chainId = chainId;
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

  async getBlob(
    ...blobReferences: BlobReference<BlobStorageName>[]
  ): Promise<{ data: string; storage: BlobStorageName } | null> {
    return tracer.startActiveSpan(
      "blob_storage_manager",
      {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "getBlob",
        },
      },
      async (span) => {
        const availableReferences = blobReferences.filter(({ storage }) =>
          this.hasStorage(storage)
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
                  const storage = this.getStorage(storageName);

                  if (!storage) {
                    throw new BlobStorageManagerError(
                      `Storage "${storageName}" is not available`
                    );
                  }

                  const blob = await storage
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

  async storeBlob(
    { data, versionedHash }: Blob,
    opts?: StoreOptions
  ): Promise<{
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
        const selectedStorages = this.#getSelectedStorages(opts);

        const results = await Promise.allSettled(
          selectedStorages.map((storage) => {
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
                  .storeBlob(this.chainId, versionedHash, data)
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
      const selectdAvailableStorageNames = selectedAvailableStorages.map(
        (s) => s.name
      );
      const missingStorageNames = uniqueInputStorageNames.filter(
        (storageName) => !selectdAvailableStorageNames.includes(storageName)
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
