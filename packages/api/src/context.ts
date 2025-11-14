import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import type IORedis from "ioredis";

import type { BlobPropagator } from "@blobscan/blob-propagator";
import type { Chain } from "@blobscan/chains";
import type { BlobscanPrismaClient } from "@blobscan/db";
import type { RollupRegistry } from "@blobscan/rollups/src/RollupRegistry";

import type { ApiClient } from "./utils";
import { createApiClient } from "./utils";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient?: ApiClient;
  blobPropagator?: BlobPropagator;
  chain: Chain;
  redis?: IORedis;
  prisma: BlobscanPrismaClient;
  rollupRegistry: RollupRegistry;
};

export type ServiceApiKeys = Partial<{
  indexer: string;
  loadNetwork: string;
}>;

export type AccessKeys = Partial<{
  blobDataRead: string;
}>;

export type ApiKeys = Partial<{
  accesses: AccessKeys;
  admin: string;
  services: ServiceApiKeys;
}>;

export type CreateContextParams = {
  apiKeys?: ApiKeys;
  blobPropagator?: BlobPropagator;
  chain: Chain;
  rollupRegistry: RollupRegistry;
  enableTracing?: boolean;
  prisma: BlobscanPrismaClient;
  redis?: IORedis;
  scope: ContextScope;
};

export type TRPCInnerContext = {
  chain: Chain;
  prisma: BlobscanPrismaClient;
  blobPropagator?: BlobPropagator;
  redis?: IORedis;
  apiClient?: ApiClient;
};

export function createTRPCInnerContext({
  chain,
  prisma,
  blobPropagator,
  apiClient,
  redis,
  rollupRegistry,
}: CreateInnerContextOptions) {
  return {
    chain,
    prisma,
    blobPropagator,
    apiClient,
    redis,
    rollupRegistry,
  };
}

export type ContextScope = "web" | "rest-api";

export function createTRPCContext({
  blobPropagator,
  prisma,
  chain,
  rollupRegistry,
  enableTracing,
  scope,
  apiKeys,
  redis,
}: CreateContextParams) {
  return async (opts: CreateContextOptions) => {
    try {
      const apiClient = apiKeys
        ? createApiClient(apiKeys, opts.req)
        : undefined;

      const innerContext = createTRPCInnerContext({
        chain,
        prisma,
        apiClient,
        blobPropagator,
        redis,
        rollupRegistry,
      });

      return {
        ...innerContext,
        enableTracing,
        scope,
        req: opts.req,
        res: opts.res,
      };
    } catch (err) {
      const err_ = err as Error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create TRPC context: ${err_.message}`,
        cause: err_.cause,
      });
    }
  };
}

export type TRPCContext = inferAsyncReturnType<
  ReturnType<typeof createTRPCContext>
>;
