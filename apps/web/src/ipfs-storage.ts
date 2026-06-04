import { IpfsStorage } from "@blobscan/blob-storage-manager";

import { env } from "./env";

const RETRY_AFTER_FAILURE_MS = 60_000;

let cached: IpfsStorage | undefined;
let pending: Promise<IpfsStorage | undefined> | undefined;
let lastFailureAt = 0;

async function build(): Promise<IpfsStorage | undefined> {
  if (!env.IPFS_STORAGE_ENABLED) {
    return undefined;
  }
  try {
    const storage = await IpfsStorage.create({
      chainId: env.CHAIN_ID,
      gatewayUrl: env.IPFS_STORAGE_GATEWAY_URL,
      apiKey: env.IPFS_STORAGE_API_KEY,
    });

    console.info("IPFS storage service set up!");
    return storage;
  } catch (err) {
    lastFailureAt = Date.now();
    console.warn(`IPFS storage unavailable for blob retrieval: ${err}`);
    return undefined;
  }
}

export async function getIpfsStorage(): Promise<IpfsStorage | undefined> {
  if (!env.IPFS_STORAGE_ENABLED) {
    return undefined;
  }

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
