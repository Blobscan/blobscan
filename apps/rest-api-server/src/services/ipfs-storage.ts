import type { IpfsStorage } from "@blobscan/blob-storage-manager";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { logger } from "@blobscan/logger";

import { createStorageFromEnv, isBlobStorageEnabled } from "./blob-storages";

let ipfsStorage: IpfsStorage | undefined;
let resolved = false;

/**
 * Lazily builds the IPFS storage used to resolve blobs by their stored
 * content-addressed dataCid. Returns undefined when IPFS is disabled or the
 * gateway can't be reached at boot — the blob-data endpoint then simply falls
 * back to the other storages instead of failing to start.
 */
export async function getIpfsStorage(): Promise<IpfsStorage | undefined> {
  if (resolved) {
    return ipfsStorage;
  }
  resolved = true;

  if (!isBlobStorageEnabled(BlobStorageName.IPFS)) {
    return undefined;
  }

  try {
    ipfsStorage = (await createStorageFromEnv(
      BlobStorageName.IPFS
    )) as IpfsStorage;

    logger.info("IPFS storage service set up!");
  } catch (err) {
    logger.warn(`IPFS storage unavailable for blob retrieval: ${err}`);
    ipfsStorage = undefined;
  }

  return ipfsStorage;
}
