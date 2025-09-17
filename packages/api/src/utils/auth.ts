import { TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NodeHTTPRequest } from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import type { ServiceApiKeys } from "../context";

type NextHTTPRequest = CreateNextContextOptions["req"];

type HTTPRequest = NodeHTTPRequest | NextHTTPRequest;

export type ServiceClient = "indexer" | "load-network" | "blob-data" | "admin";

export function createServiceClient(
  {
    blobDataReadKey,
    indexerServiceSecret,
    loadNetworkServiceKey,
  }: ServiceApiKeys,
  req: HTTPRequest
): ServiceClient | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return;
  }

  try {
    if (blobDataReadKey && blobDataReadKey === token) {
      return "blob-data";
    }

    if (loadNetworkServiceKey && loadNetworkServiceKey === token) {
      return "load-network";
    }

    if (indexerServiceSecret) {
      const decoded = jwt.verify(token, indexerServiceSecret) as string;

      if (decoded === token) {
        return "indexer";
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return;
    }

    throw new TRPCError({ code: "BAD_REQUEST" });
  }
}
