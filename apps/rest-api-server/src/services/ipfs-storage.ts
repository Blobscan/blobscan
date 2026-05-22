import type { IpfsStorage } from "@blobscan/blob-storage-manager";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { logger } from "@blobscan/logger";

import { createStorageFromEnv, isBlobStorageEnabled } from "./blob-storages";

// Retry the gateway health-check at most once every minute when a previous
// attempt failed, so a temporarily-unreachable gateway doesn't disable IPFS
// fallback for the lifetime of the process while also not hammering a
// permanently broken endpoint on every blob-data request.
const RETRY_AFTER_FAILURE_MS = 60_000;

let cached: IpfsStorage | undefined;
let pending: Promise<IpfsStorage | undefined> | undefined;
let lastFailureAt = 0;

async function build(): Promise<IpfsStorage | undefined> {
  if (!isBlobStorageEnabled(BlobStorageName.IPFS)) {
    return undefined;
  }

  try {
    const storage = (await createStorageFromEnv(
      BlobStorageName.IPFS
    )) as IpfsStorage;

    logger.info("IPFS storage service set up!");
    return storage;
  } catch (err) {
    lastFailureAt = Date.now();
    logger.warn(`IPFS storage unavailable for blob retrieval: ${err}`);
    return undefined;
  }
}

/**
 * Lazily builds the IPFS storage used to resolve blobs by their stored
 * content-addressed dataCid. Returns undefined when IPFS is disabled or the
 * gateway can't be reached at boot — the blob-data endpoint then simply falls
 * back to the other storages instead of failing to start.
 *
 * Concurrent callers share the same in-flight promise (no race on the
 * "resolved" flag), and a failed health-check is retried after a cool-off
 * window so a transient gateway outage doesn't disable IPFS forever.
 */
export async function getIpfsStorage(): Promise<IpfsStorage | undefined> {
  if (cached) {
    return cached;
  }

  if (pending) {
    return pending;
  }

  if (lastFailureAt && Date.now() - lastFailureAt < RETRY_AFTER_FAILURE_MS) {
    return undefined;
  }

  pending = build().then((storage) => {
    cached = storage;
    pending = undefined;
    return storage;
  });

  return pending;
}
