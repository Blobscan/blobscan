import { TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NodeHTTPRequest } from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import { env } from "@blobscan/env";

type NextHTTPRequest = CreateNextContextOptions["req"];

type HTTPRequest = NodeHTTPRequest | NextHTTPRequest;

export type APIClientType = "indexer" | "weavevm" | "blob-data";

export type APIClient = {
  type: APIClientType;
};

function isValidIndexerAPIKey(token: string) {
  const decoded = jwt.verify(token, env.SECRET_KEY) as string;

  return decoded;
}

function isValidWeaveVMAPIKey(token: string) {
  return token === env.WEAVEVM_API_KEY;
}

function isValidBlobDataAPIKey(token: string) {
  return token === env.BLOB_DATA_API_KEY;
}

export function retrieveAPIClient(req: HTTPRequest): APIClient | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return;
  }

  try {
    if (isValidBlobDataAPIKey(token)) {
      return { type: "blob-data" };
    }

    if (isValidWeaveVMAPIKey(token)) {
      return { type: "weavevm" };
    }

    if (isValidIndexerAPIKey(token)) {
      return { type: "indexer" };
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return;
    }

    throw new TRPCError({ code: "BAD_REQUEST" });
  }
}
