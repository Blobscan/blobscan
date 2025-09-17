import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";

import type { BlobPropagator } from "@blobscan/blob-propagator";
import type { BlobscanPrismaClient } from "@blobscan/db";

import type { ApiClient } from "./utils";
import { createApiClient } from "./utils";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient?: ApiClient;
  blobPropagator?: BlobPropagator;
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
  services: ServiceApiKeys;
  accesses: AccessKeys;
}>;

export type CreateContextParams = {
  blobPropagator?: BlobPropagator;
  chainId: number;
  prisma: BlobscanPrismaClient;
  enableTracing?: boolean;
  scope: ContextScope;
  apiKeys?: ApiKeys;
};

export type TRPCInnerContext = {
  prisma: BlobscanPrismaClient;
  blobPropagator?: BlobPropagator;
  apiClient?: ApiClient;
};

export function createTRPCInnerContext(opts: CreateInnerContextOptions) {
  return {
    prisma: opts.prisma,
    blobPropagator: opts.blobPropagator,
    apiClient: opts.apiClient,
  };
}

export type ContextScope = "web" | "rest-api";

export function createTRPCContext({
  blobPropagator,
  prisma,
  chainId,
  enableTracing,
  scope,
  apiKeys,
}: CreateContextParams) {
  return async (opts: CreateContextOptions) => {
    try {
      const apiClient = apiKeys
        ? createApiClient(apiKeys, opts.req)
        : undefined;

      const innerContext = createTRPCInnerContext({
        prisma,
        apiClient,
        blobPropagator,
      });

      return {
        ...innerContext,
        chainId,
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
