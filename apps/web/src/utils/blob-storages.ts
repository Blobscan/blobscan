import { env } from "~/env.mjs";
import type { BlobStorage } from "~/types";

type StorageUrl<S extends BlobStorage> = S extends "file_system"
  ? null
  : S extends "google"
  ? string
  : S extends "postgres"
  ? null
  : S extends "swarm"
  ? string
  : null;

export function buildStorageDownloadUrl<S extends BlobStorage>(
  storage: S,
  blobReference: string
): StorageUrl<S> {
  let url;

  switch (storage) {
    case "file_system":
      url = null;
      break;
    case "postgres":
      url = null;
      break;
    case "google":
      url = `https://storage.googleapis.com/${env.NEXT_PUBLIC_GOOGLE_STORAGE_BUCKET_NAME}/${blobReference}`;
      break;
    case "swarm":
      url = `https://gateway.ethswarm.org/access/${blobReference}`;
      break;
  }

  return url as StorageUrl<S>;
}
