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
import type { BlobscanPrismaClient } from "@blobscan/db";
import type { Network } from "@blobscan/network-blob-config";

import type { ApiClient } from "./utils";
import { createApiClient } from "./utils";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient?: ApiClient;
  blobPropagator?: BlobPropagator;
  network: Network;
  redis?: IORedis;
  prisma: BlobscanPrismaClient;
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
  network: Network;
  enableTracing?: boolean;
  prisma: BlobscanPrismaClient;
  redis?: IORedis;
  scope: ContextScope;
};

export type TRPCInnerContext = {
  network: Network;
  prisma: BlobscanPrismaClient;
  blobPropagator?: BlobPropagator;
  redis?: IORedis;
  apiClient?: ApiClient;
};

export function createTRPCInnerContext({
  network,
  prisma,
  blobPropagator,
  apiClient,
  redis,
}: CreateInnerContextOptions) {
  return {
    network,
    prisma,
    blobPropagator,
    apiClient,
    redis,
  };
}

export type ContextScope = "web" | "rest-api";

export function createTRPCContext({
  blobPropagator,
  prisma,
  network,
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
        network,
        prisma,
        apiClient,
        blobPropagator,
        redis,
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
