import { TRPCError } from "@trpc/server";
import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";

import { env } from "./env";

type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient: string | null;
};

export function getJWTFromRequest(
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
  const blobStorageManager = await createOrLoadBlobStorageManager();

  return {
    prisma,
    blobStorageManager,
    apiClient: opts?.apiClient,
  };
}

export async function createTRPCContext(opts: CreateContextOptions) {
  const apiClient = getJWTFromRequest(opts.req);

  const innerContext = await createTRPCInnerContext({ apiClient });

  return {
    ...innerContext,
    req: opts.req,
    res: opts.res,
  };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
export type TRCInnerContext = inferAsyncReturnType<
  typeof createTRPCInnerContext
>;
