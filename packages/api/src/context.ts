import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";

import { prisma } from "@blobscan/db";

import type { BlobPropagator } from "./types";
import type { APIClient } from "./utils";
import { retrieveAPIClient } from "./utils";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient?: APIClient;
  blobPropagator?: BlobPropagator;
};

export type TRPCInnerContext = {
  prisma: typeof prisma;
  blobPropagator?: BlobPropagator;
  apiClient?: APIClient;
};

export function createTRPCInnerContext(opts?: CreateInnerContextOptions) {
  return {
    prisma,
    blobPropagator: opts?.blobPropagator,
    apiClient: opts?.apiClient,
  };
}

export type ContextScope = "web" | "rest-api";

export function createTRPCContext({
  blobPropagator,
  scope,
}: {
  blobPropagator?: BlobPropagator;
  scope: ContextScope;
}) {
  return async (opts: CreateContextOptions) => {
    try {
      const apiClient = retrieveAPIClient(opts.req);

      const innerContext = createTRPCInnerContext({
        apiClient,
        blobPropagator,
      });

      return {
        ...innerContext,
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
