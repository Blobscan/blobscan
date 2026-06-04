import { createServerSideHelpers as _createServerSideHelepers } from "@trpc/react-query/server";

import { createAppRouter, createTRPCContext } from "@blobscan/api";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getChain } from "@blobscan/chains";
import { RollupRegistry } from "@blobscan/rollups/src/RollupRegistry";

import { env } from "./env";
import { getIpfsStorage } from "./ipfs-storage";
import { prisma } from "./prisma";
import { redis } from "./redis";

const chain = getChain(env.CHAIN_ID);

const rollupRegistry = RollupRegistry.create(env.CHAIN_ID);

export const appRouter = createAppRouter({
  blobRouter: {
    blobDataProcedure: {
      enabled: env.BLOB_DATA_API_ENABLED,
      protected: !!env.BLOB_DATA_API_KEY?.length,
    },
  },
});

// Resolve ipfsStorage lazily per-request so the gateway health-check runs
// after startup and caches the result for subsequent calls.
export async function createContext(opts: CreateNextContextOptions) {
  const ipfsStorage = await getIpfsStorage();
  return createTRPCContext({
    scope: "web",
    chain,
    rollupRegistry,
    prisma,
    redis,
    enableTracing: env.TRACES_ENABLED,
    ipfsStorage,
    apiKeys: {
      accesses: {
        blobDataRead: env.BLOB_DATA_API_KEY,
      },
    },
  })(opts);
}
