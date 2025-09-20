import { captureException } from "@sentry/nextjs";

import { createAppRouter, createTRPCContext } from "@blobscan/api";
import { createNextApiHandler } from "@blobscan/api";

import { env } from "~/env.mjs";
import { prisma } from "~/prisma";
import { redis } from "~/redis";

const appRouter = createAppRouter({
  blobRouter: {
    blobDataProcedure: {
      enabled: env.BLOB_DATA_API_ENABLED,
      protected: !!env.BLOB_DATA_API_KEY?.length,
    },
  },
});

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext({
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
  }),
  onError({ error }) {
    captureException(error);

    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(error);
    }
  },
});
