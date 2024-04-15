import { env } from "~/env.mjs";
import type { BlobStorage } from "~/types";

export function buildStorageDownloadUrl(
  storage: BlobStorage,
  blobReference: string
): string | null {
  switch (storage) {
    case "file_system":
      return null;
    case "google":
      return `https://storage.googleapis.com/${env.NEXT_PUBLIC_GOOGLE_STORAGE_BUCKET_NAME}/${blobReference}`;
    case "postgres":
      return null;
    case "swarm":
      return `https://gateway.ethswarm.org/access/${blobReference}`;
    default:
      return null;
  }
}
