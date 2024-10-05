import type { NextApiRequest } from "next/types";
import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import cookie from "cookie";
import jwt from "jsonwebtoken";

import { getBlobPropagator } from "@blobscan/blob-propagator";
import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import { posthog } from "./posthog";

export type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient: string | null;
};

function getJWTFromRequest(
  req: NodeHTTPRequest | CreateNextContextOptions["req"]
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  try {
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      return null;
    }

    const decoded = jwt.verify(token, env.SECRET_KEY) as string;

    return decoded;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return null;
    }

    throw new TRPCError({ code: "BAD_REQUEST" });
  }
}

export async function createTRPCInnerContext(opts?: CreateInnerContextOptions) {
  const blobStorageManager = await getBlobStorageManager();
  const blobPropagator = await getBlobPropagator();

  return {
    prisma,
    blobStorageManager,
    blobPropagator,
    apiClient: opts?.apiClient,
  };
}

function getIP(req: NodeHTTPRequest | NextApiRequest): string | undefined {
  const ip = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress;

  if (Array.isArray(ip)) {
    return ip[0];
  }

  return ip;
}

export function createTRPCContext(
  {
    scope,
  }: {
    scope: string;
  } = { scope: "" }
) {
  return async (opts: CreateContextOptions) => {
    try {
      const apiClient = getJWTFromRequest(opts.req);

      const innerContext = await createTRPCInnerContext({
        apiClient,
      });

      if (posthog) {
        const cookies = cookie.parse(opts.req.headers.cookie ?? "");

        let distinctId = cookies["distinctId"];

        if (!distinctId) {
          distinctId = crypto.randomUUID();

          opts.res.setHeader(
            "Set-Cookie",
            cookie.serialize("distinctId", distinctId, {
              maxAge: 60 * 60 * 24 * 365,
            })
          );
        }

        posthog.capture({
          distinctId,
          event: "trpc_request",
          properties: {
            $ip: getIP(opts.req),
            scope,
            $current_url: opts.req.url,
            method: opts.req.method,
          },
        });
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
export type TRPCInnerContext = inferAsyncReturnType<
  typeof createTRPCInnerContext
>;
