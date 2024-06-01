import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import { getBlobPropagator } from "@blobscan/blob-propagator";
import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

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
