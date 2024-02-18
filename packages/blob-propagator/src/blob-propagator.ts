import IORedis from "ioredis";

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

  const connection = new IORedis(env.REDIS_URI, { maxRetriesPerRequest: null });

  return new BlobPropagator(availableStorages, {
    workerOptions: {
      connection,
    },
  });
}
const blobPropagator =
  env.BLOB_PROPAGATOR_ENABLED === true ? createBlobPropagator() : undefined;

export { blobPropagator, createBlobPropagator };
