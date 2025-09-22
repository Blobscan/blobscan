import { createAppRouter, createTRPCContext } from "@blobscan/api";

import { env } from "./env.mjs";
import { prisma } from "./prisma";
import { redis } from "./redis";

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
  chainId: env.CHAIN_ID,
  prisma,
  redis,
  enableTracing: env.TRACES_ENABLED,
  apiKeys: {
    accesses: {
      blobDataRead: env.BLOB_DATA_API_KEY,
    },
  },
});
