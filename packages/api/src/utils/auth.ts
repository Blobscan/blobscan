import { TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NodeHTTPRequest } from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";

import type { ApiKeys } from "../context";

type NextHTTPRequest = CreateNextContextOptions["req"];

type HTTPRequest = NodeHTTPRequest | NextHTTPRequest;

export type ServiceClient = "indexer" | "load-network";

export type AccessClient = "blob-data";

export type ApiClient = ServiceClient | AccessClient | "admin";

export function createApiClient(
  apiKeys: ApiKeys,
  req: HTTPRequest
): ApiClient | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return;
  }

  const {
    admin: adminKey,
    accesses: { blobDataRead: blobDataReadKey } = {},
    services: { indexer: indexerKey, loadNetwork: loadNetworkKey } = {},
  } = apiKeys;

  try {
    if (adminKey && adminKey === token) {
      return "admin";
    }

    if (blobDataReadKey && blobDataReadKey === token) {
      return "blob-data";
    }

    if (loadNetworkKey && loadNetworkKey === token) {
      return "load-network";
    }

    if (indexerKey) {
      const decodedPayload = jwt.verify(token, indexerKey);

      if (decodedPayload) {
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
