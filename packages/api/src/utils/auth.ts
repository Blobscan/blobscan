import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

import type { ApiKeys } from "../context";

export type ServiceClient = "indexer" | "load-network";

export type AccessClient = "blob-data";

export type ApiClient = ServiceClient | AccessClient | "admin";

export function createApiClient(
  apiKeys: ApiKeys,
  authHeader: string
): ApiClient | undefined {
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
