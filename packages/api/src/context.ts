import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import cookie from "cookie";

import type { BlobPropagator } from "@blobscan/blob-propagator";
import { getBlobPropagator } from "@blobscan/blob-propagator";
import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import { PostHogClient, shouldIgnoreURL } from "./posthog";
import type { APIClient } from "./utils";
import { retrieveAPIClient } from "./utils";

type NextHTTPRequest = CreateNextContextOptions["req"];

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

function getIP(req: NodeHTTPRequest | NextHTTPRequest): string | undefined {
  const ip = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress;

  if (Array.isArray(ip)) {
    return ip[0];
  }

  return ip;
}

type ContextScope = "web" | "rest-api";

export function createTRPCContext({ scope }: { scope: ContextScope }) {
  return async (opts: CreateContextOptions) => {
    try {
      const apiClient = retrieveAPIClient(opts.req);

      const innerContext = await createTRPCInnerContext({
        apiClient,
      });

      const posthog = PostHogClient();

      if (posthog && !shouldIgnoreURL(opts.req.url)) {
        const cookies = cookie.parse(opts.req.headers.cookie ?? "");

        let distinctId = cookies["distinctId"];

        if (!distinctId) {
          distinctId = crypto.randomUUID();

          opts.res.setHeader(
            "Set-Cookie",
            cookie.serialize("distinctId", distinctId, {
              maxAge: 60 * 60 * 24 * 365,
              httpOnly: false,
              path: "/",
            })
          );
        }

        let currentUrl = opts.req.url;
        let pathname: string | undefined;
        let query: string | undefined;

        if (opts.req.url) {
          const url = new URL(opts.req.url, env.BLOBSCAN_API_BASE_URL);
          pathname = url.pathname;
          currentUrl = url.toString();
          query = url.searchParams.toString();
        }

        posthog.capture({
          distinctId,
          event: "trpc_request",
          properties: {
            $ip: getIP(opts.req),
            scope,
            $current_url: currentUrl,
            network: env.NETWORK_NAME,
            pathname,
            query,
          },
        });

        await posthog.shutdown();
      }

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
