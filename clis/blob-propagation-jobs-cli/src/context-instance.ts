import { BlobStorage } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";

import { Context } from "./Context";

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

export const context = new Context(availableStorages, env.REDIS_URI);
