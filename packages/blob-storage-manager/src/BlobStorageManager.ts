import type { BlobStorage as BlobStorageNames } from "@blobscan/db";
import { api, SemanticAttributes } from "@blobscan/open-telemetry";

import type { BlobStorage } from "./BlobStorage";
import { tracer } from "./instrumentation";
import type { PostgresStorage, SwarmStorage } from "./storages";
import type { GoogleStorage } from "./storages";

export type StorageOf<T extends BlobStorageNames> = T extends "GOOGLE"
  ? GoogleStorage
  : T extends "SWARM"
  ? SwarmStorage
  : T extends "POSTGRES"
  ? PostgresStorage
  : never;

export type BlobStorages<SNames extends BlobStorageNames> = {
  [K in SNames]?: StorageOf<K>;
};

export type BlobReference<
  StorageName extends BlobStorageNames = BlobStorageNames
> = {
  reference: string;
  storage: StorageName;
};

export type StorageError<SName extends BlobStorageNames = BlobStorageNames> = {
  storage: SName;
  error: Error;
};

type Blob = {
  data: string;
  versionedHash: string;
};
export class BlobStorageManager<
  SNames extends BlobStorageNames = BlobStorageNames,
  T extends BlobStorages<SNames> = BlobStorages<SNames>
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

  async getBlob(
    ...blobReferences: BlobReference<SNames>[]
  ): Promise<{ data: string; storage: SNames } | null> {
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
                  const result = await (
                    this.#blobStorages[storageName] as BlobStorage
                  )
                    .getBlob(reference)
                    .then((data) => ({
                      data,
                      storage: storageName,
                    }));

                  storageSpan.end();

                  return result;
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
              const storageName = availableReferences[i]?.storage ?? "Unknown";

              return `${storageName} - ${err}`;
            });

            throw new Error(`${errorMessage}: ${storageErrors.join(",")}`);
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

  async storeBlob({ data, versionedHash }: Blob): Promise<{
    references: BlobReference<SNames>[];
    errors: StorageError<SNames>[];
  }> {
    return tracer.startActiveSpan(
      "blob_storage_manager",
      {
        attributes: {
          [SemanticAttributes.CODE_FUNCTION]: "storeBlob",
        },
      },
      async (span) => {
        const availableStorages = Object.entries(this.#blobStorages).filter(
          ([, storage]) => storage
        ) as [SNames, BlobStorage][];
        const results = await Promise.allSettled(
          availableStorages.map(([name, storage]) => {
            return tracer.startActiveSpan(
              "blob_storage_manager:storage",
              {
                attributes: {
                  storage: name,
                  [SemanticAttributes.CODE_FUNCTION]: "storeBlob",
                },
              },
              async (storageSpan) => {
                const result = await storage
                  .storeBlob(this.chainId, versionedHash, data)
                  .then<BlobReference<SNames>>((reference) => ({
                    reference,
                    storage: name,
                  }));

                storageSpan.end();

                return result;
              }
            );
          })
        );

        const references = results
          .filter(
            (res): res is PromiseFulfilledResult<BlobReference<SNames>> =>
              res.status === "fulfilled"
          )
          .map((res) => res.value);
        const errors = results.reduce<StorageError<SNames>[]>(
          (prevFailedUploads, res, i) => {
            const storage = availableStorages[i] as [SNames, BlobStorage];

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
}
