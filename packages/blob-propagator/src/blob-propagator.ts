import type { RedisOptions } from "bullmq";

import { BlobStorage } from "@blobscan/db";

import { BlobPropagator } from "./BlobPropagator";
import { env } from "./env";

function createBlobPropagator() {
  const availableStorages: BlobStorage[] = [];

  if (env.GOOGLE_STORAGE_ENABLED) {
    availableStorages.push(BlobStorage.GOOGLE);
  }

  if (env.POSTGRES_STORAGE_ENABLED) {
    availableStorages.push(BlobStorage.POSTGRES);
  }

  if (env.SWARM_STORAGE_ENABLED) {
    availableStorages.push(BlobStorage.SWARM);
  }

  const connection: RedisOptions = {
    host: env.REDIS_QUEUE_HOST,
    port: env.REDIS_QUEUE_PORT,
    password: env.REDIS_QUEUE_PASSWORD,
    username: env.REDIS_QUEUE_USERNAME,
  };

  return new BlobPropagator(availableStorages, {
    workerOptions: {
      connection,
    },
  });
}

const blobPropagator = env.BLOB_PROPAGATOR_ENABLED
  ? createBlobPropagator()
  : undefined;

export { blobPropagator, createBlobPropagator };
