import type { ConnectionOptions } from "bullmq";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";

import { BlobPropagator } from "./BlobPropagator";
import { env } from "./env";

let blobPropagator: BlobPropagator | undefined;

export async function createOrLoadBlobPropagator() {
  if (!blobPropagator) {
    const bsm = await createOrLoadBlobStorageManager();

    const availableStorages = Object.values(BlobStorage).filter((storageName) =>
      bsm.hasStorage(storageName)
    );
    const connection: ConnectionOptions = {
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
