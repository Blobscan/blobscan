import { createHash, timingSafeEqual } from "crypto";

import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

import type { ApiKeys } from "../context";

export type ServiceClient = "indexer" | "ipfs" | "load-network";

export type AccessClient = "blob-data";

export type ApiClient = ServiceClient | AccessClient | "admin";

// Constant-time bearer-token comparison. timingSafeEqual requires equal-length
// buffers, so we feed it sha256(token) and sha256(expected) — same length
// regardless of input — to avoid leaking key length through early-return
// timing on raw byte comparison.
function tokenMatches(expected: string, provided: string): boolean {
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(provided).digest();
  return timingSafeEqual(a, b);
}

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
    services: { indexer: indexerKey, ipfs: ipfsKey, loadNetwork: loadNetworkKey } = {},
  } = apiKeys;

  try {
    if (adminKey && tokenMatches(adminKey, token)) {
      return "admin";
    }

    if (blobDataReadKey && tokenMatches(blobDataReadKey, token)) {
      return "blob-data";
    }

    if (ipfsKey && tokenMatches(ipfsKey, token)) {
      return "ipfs";
    }

    if (loadNetworkKey && tokenMatches(loadNetworkKey, token)) {
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
