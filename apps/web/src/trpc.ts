import { createServerSideHelpers as _createServerSideHelepers } from "@trpc/react-query/server";
import superjson from "superjson";

import {
  createAppRouter,
  createTRPCContext,
  createTRPCInnerContext,
} from "@blobscan/api";
import type { TRPCContext } from "@blobscan/api";

import { chain } from "./chain";
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
  chain,
  prisma,
  redis,
  enableTracing: env.TRACES_ENABLED,
  apiKeys: {
    accesses: {
      blobDataRead: env.BLOB_DATA_API_KEY,
    },
  },
});

export function createServerSideHelpers() {
  return _createServerSideHelepers({
    router: appRouter,
    transformer: superjson,
    ctx: createTRPCInnerContext({
      chain,
      prisma,
    }) as TRPCContext,
  });
}
