import { createHash } from "crypto";

import type { Request, Response, NextFunction } from "express";

import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

import { matomoTracker } from "../clients/matomo-tracker";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const TRACKING_EXCLUSIONS: { methods?: RequestMethod[]; path: string }[] = [
  { methods: ["PUT", "POST"], path: "indexer" },
  { methods: ["PUT", "POST"], path: "blockchain-sync-state" },
  { path: "healthcheck" },
  { path: "metrics" },
  { path: "logging" },
];

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.socket.remoteAddress;

  return ip || "unknown";
}

function shouldSkipTracking(req: Request): boolean {
  const path = req.path;

  return TRACKING_EXCLUSIONS.some((rule) => {
    const isPathBlacklisted = path
      .split("/")
      .some((segment) => segment === rule.path);

    if (rule.methods?.length) {
      return (
        isPathBlacklisted && rule.methods.includes(req.method as RequestMethod)
      );
    }

    return isPathBlacklisted;
  });
}

function hashToHex(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

/**
 * Extract the bearer token from the Authorization header, if present.
 */
function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return;
  }

  const [type, token] = authHeader.split(" ");

  return type === "Bearer" && token ? token : undefined;
}

/**
 * Generate a stable 16-character hex visitor ID for Matomo's `cid` parameter.
 *
 * Priority:
 *  1. Hash of the bearer token (authenticated clients)
 *  2. Hash of IP + User-Agent (anonymous clients)
 */
function getVisitorId(req: Request): string {
  const token = getBearerToken(req);

  if (token) {
    return hashToHex(token);
  }

  return hashToHex(`${getClientIp(req)}:${req.headers["user-agent"] || "unknown"}`);
}

export function matomoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!matomoTracker) {
    next();

    return;
  }

  if (shouldSkipTracking(req)) {
    next();

    return;
  }

  const start = Date.now();

  res.on("finish", () => {
    const clientIp = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "unknown";
    const acceptLanguage = req.headers["accept-language"] || "unknown";
    const url = req.originalUrl || req.url;
    const path = req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    const actionName = `${method} ${path}`;

    const fullUrl = `${req.protocol}://${req.get("host") || "unknown"}${url}`;

    const visitorId = getVisitorId(req);
    const bearerToken = getBearerToken(req);

    matomoTracker
      ?.track({
        url: fullUrl,
        action_name: actionName,
        token_auth: env.MATOMO_AUTH_TOKEN,
        ua: userAgent,
        cip: clientIp,
        cid: visitorId,
        ...(bearerToken && { uid: hashToHex(bearerToken) }),
        lang: acceptLanguage,
        pf_srv: (Date.now() - start).toString(),
        cvar: JSON.stringify({
          1: ["HTTP Status", statusCode.toString()],
          2: ["HTTP Method", method],
        }),
      })
      .catch((error) => {
        logger.warning(`Failed to track request ${actionName} `, error);
      });
  });

  next();
}
