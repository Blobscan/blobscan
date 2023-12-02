import type { RedisOptions } from "bullmq";

import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";

import { BlobPropagator } from "./BlobPropagator";
import { env } from "./env";

let blobPropagator: BlobPropagator | undefined;

export async function getBlobPropagator() {
  if (!blobPropagator) {
    const blobStorageManager = await getBlobStorageManager();
    const availableStorages = Object.values(BlobStorage).filter((storageName) =>
      blobStorageManager.hasStorage(storageName)
    );
    const connection: RedisOptions = {
      host: env.REDIS_QUEUE_HOST,
      port: env.REDIS_QUEUE_PORT,
      password: env.REDIS_QUEUE_PASSWORD,
      username: env.REDIS_QUEUE_USERNAME,
    };

    blobPropagator = new BlobPropagator(availableStorages, {
      workerOptions: {
        useWorkerThreads: true,
        connection,
      },
    });
  }

  return blobPropagator;
}
