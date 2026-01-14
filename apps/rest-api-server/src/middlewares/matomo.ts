import type { Request, Response, NextFunction } from "express";

import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

import { createOrGetMatomoTracker } from "../matomo-tracker";

const EXCLUDED_PATHS = ["/metrics", "/healthcheck", "/logging"];

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.socket.remoteAddress;

  return ip || "unknown";
}

export function matomoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!env.MATOMO_ENABLED) {
    next();

    return;
  }

  const matomoTracker = createOrGetMatomoTracker();

  const path = req.path;

  if (EXCLUDED_PATHS.includes(path)) {
    next();

    return;
  }

  res.on("finish", () => {
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers["user-agent"] || "unknown";
      const url = req.originalUrl || req.url;
      const method = req.method;
      const statusCode = res.statusCode;

      const actionName = `${method} ${path}`;

      const fullUrl = `${req.protocol}://${req.get("host") || "unknown"}${url}`;

      console.log("Tracking request in Matomo", {
        url: fullUrl,
        action_name: actionName,
        token_auth: env.MATOMO_AUTH_TOKEN,
        ua: userAgent,
        cip: clientIp,
        cvar: JSON.stringify({
          1: ["HTTP Status", statusCode.toString()],
          2: ["HTTP Method", method],
        }),
      });
      matomoTracker?.track({
        url: fullUrl,
        action_name: actionName,
        token_auth: env.MATOMO_AUTH_TOKEN,
        ua: userAgent,
        cip: clientIp,
        cvar: JSON.stringify({
          1: ["HTTP Status", statusCode.toString()],
          2: ["HTTP Method", method],
        }),
      });
    } catch (error) {
      logger.warning("Failed to track request in Matomo", error);
    }
  });

  next();
}
