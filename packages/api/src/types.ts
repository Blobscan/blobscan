export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type PartialOrFull<T> = T | Partial<T>;

export interface BlobPropagator {
  propagateBlobs(
    blobs: {
      versionedHash: string;
      data: string;
    }[]
  ): Promise<void>;
}
