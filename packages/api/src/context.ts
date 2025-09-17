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

import type { ServiceClient } from "./utils";
import { createServiceClient } from "./utils";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  serviceClient?: ServiceClient;
  blobPropagator?: BlobPropagator;
  prisma: BlobscanPrismaClient;
};

export type ServiceApiKeys = Partial<{
  indexerServiceSecret: string;
  loadNetworkServiceKey: string;
  blobDataReadKey: string;
}>;

export type CreateContextParams = {
  blobPropagator?: BlobPropagator;
  chainId: number;
  prisma: BlobscanPrismaClient;
  enableTracing?: boolean;
  scope: ContextScope;
  serviceApiKeys?: ServiceApiKeys;
};

export type TRPCInnerContext = {
  prisma: BlobscanPrismaClient;
  blobPropagator?: BlobPropagator;
  apiClient?: ServiceClient;
};

export function createTRPCInnerContext(opts: CreateInnerContextOptions) {
  return {
    prisma: opts.prisma,
    blobPropagator: opts.blobPropagator,
    apiClient: opts.serviceClient,
  };
}

export type ContextScope = "web" | "rest-api";

export function createTRPCContext({
  blobPropagator,
  prisma,
  chainId,
  enableTracing,
  scope,
  serviceApiKeys,
}: CreateContextParams) {
  return async (opts: CreateContextOptions) => {
    try {
      const serviceClient = serviceApiKeys
        ? createServiceClient(serviceApiKeys, opts.req)
        : undefined;

      const innerContext = createTRPCInnerContext({
        prisma,
        serviceClient,
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
