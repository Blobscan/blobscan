import { TRPCError, type inferAsyncReturnType } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import {
  type NodeHTTPCreateContextFnOptions,
  type NodeHTTPRequest,
  type NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import { prisma } from "@blobscan/db";

import { storage } from "./clients/google";
import { swarm } from "./clients/swarm";
import { SECRET } from "./env";

type CreateContextOptions =
  | NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>
  | CreateNextContextOptions;

type CreateInnerContextOptions = Partial<CreateContextOptions> & {
  apiClient: string | null;
};

function getJWTFromRequest(
  req: NodeHTTPRequest | CreateNextContextOptions["req"],
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

    const decoded = jwt.verify(token, SECRET) as string;

    return decoded;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return null;
    }

    throw new TRPCError({ code: "BAD_REQUEST" });
  }
}

export function createTRPCInnerContext(opts?: CreateInnerContextOptions) {
  return {
    prisma,
    storage,
    swarm,
    apiClient: opts?.apiClient,
  };
}

export function createTRPCContext(opts: CreateContextOptions) {
  const apiClient = getJWTFromRequest(opts.req);

  const innerContext = createTRPCInnerContext({ apiClient });

  return {
    ...innerContext,
    req: opts.req,
    res: opts.res,
  };
}

export type TRPCContext = inferAsyncReturnType<typeof createTRPCInnerContext>;
