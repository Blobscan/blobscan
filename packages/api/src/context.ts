import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";

import type { BlobPropagator } from "@blobscan/blob-propagator";
import { getBlobPropagator } from "@blobscan/blob-propagator";
import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";

import type { APIClient } from "./utils";
import { retrieveAPIClient } from "./utils";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient?: APIClient;
};

export type TRPCInnerContext = {
  prisma: typeof prisma;
  blobStorageManager: BlobStorageManager;
  blobPropagator?: BlobPropagator;
  apiClient?: APIClient;
};

export async function createTRPCInnerContext(
  opts?: CreateInnerContextOptions
): Promise<TRPCInnerContext> {
  const blobStorageManager = await getBlobStorageManager();
  const blobPropagator = await getBlobPropagator();

  return {
    prisma,
    blobStorageManager,
    blobPropagator,
    apiClient: opts?.apiClient,
  };
}

type ContextScope = "web" | "rest-api";

export function createTRPCContext({ scope }: { scope: ContextScope }) {
  return async (opts: CreateContextOptions) => {
    try {
      const apiClient = retrieveAPIClient(opts.req);

      const innerContext = await createTRPCInnerContext({
        apiClient,
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
