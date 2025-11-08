import { createServerSideHelpers as _createServerSideHelepers } from "@trpc/react-query/server";
import superjson from "superjson";

import {
  createAppRouter,
  createTRPCContext,
  createTRPCInnerContext,
} from "@blobscan/api";
import type { TRPCContext } from "@blobscan/api";

import { env } from "./env.mjs";
import { network } from "./network";
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
  network,
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
      network,
      prisma,
    }) as TRPCContext,
  });
}
