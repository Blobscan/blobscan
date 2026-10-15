import { createServerSideHelpers as _createServerSideHelepers } from "@trpc/react-query/server";

import { createAppRouter, createTRPCContext } from "@blobscan/api";
import { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { getChain } from "@blobscan/chains";
import { RollupRegistry } from "@blobscan/rollups/src/RollupRegistry";

import { createBlobStorages } from "./blob-storages";
import { env } from "./env";
import { prisma } from "./prisma";
import { redis } from "./redis";

const chain = getChain(env.CHAIN_ID);

const rollupRegistry = RollupRegistry.create(env.CHAIN_ID);

const blobStorages = await createBlobStorages();
const blobStorageManager = blobStorages.length
  ? new BlobStorageManager(blobStorages)
  : undefined;

export const appRouter = createAppRouter({
  blobRouter: {
    blobDataProcedure: {
      enabled: env.BLOB_DATA_API_ENABLED,
      protected: !!env.BLOB_DATA_API_KEY?.length,
    },
  },
});

export const createContext = createTRPCContext({
  scope: "web",
  chain,
  rollupRegistry,
  prisma,
  redis,
  blobStorageManager,
  enableTracing: env.TRACES_ENABLED,
  apiKeys: {
    accesses: {
      blobDataRead: env.BLOB_DATA_API_KEY,
    },
  },
});
