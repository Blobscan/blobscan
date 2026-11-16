import type { Request, RequestHandler, Response } from "express";
import { BlockList, isIP } from "node:net";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { RateLimiterRes } from "rate-limiter-flexible";

import { createTooManyRequestsBody } from "@blobscan/errors";

export type RateLimitOptions = {
  /** One budget per client IP, shared by every route. */
  limiter?: RateLimiterAbstract;
  /**
   * Budget per client IP for one resource (a blob, a transaction, a block).
   * Catches a client that fetches the same thing over and over while its
   * overall rate stays low.
   */
  repeatLimiter?: RateLimiterAbstract;
  /** CIDRs never limited, e.g. callers inside the cluster. */
  allowlist: string[];
};

/**
 * Single-resource lookups only: `/blobs/<versioned hash>`, `/blobs/<hash>/data`,
 * `/transactions/<hash>` and `/blocks/<hash | number>`. List endpoints are left
 * out on purpose: paging through them repeats the same path with a different
 * query string and is legitimate.
 */
const RESOURCE_PATH_REGEX =
  /^\/(?:blobs\/0x[0-9a-f]{1,130}(?:\/data)?|transactions\/0x[0-9a-f]{1,130}|blocks\/(?:0x[0-9a-f]{1,130}|\d{1,20}))\/?$/i;

/** Normalized path of a single-resource lookup, or undefined for any other request. */
export function getResourcePath(req: Request): string | undefined {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return;
  }

  if (!RESOURCE_PATH_REGEX.test(req.path)) {
    return;
  }

  return req.path.toLowerCase().replace(/\/$/, "");
}

function describeWindow(seconds: number): string {
  return seconds === 1 ? "second" : `${seconds} seconds`;
}

/** Consumes one point. Resolves with the rejection if the budget is spent. */
async function consume(
  limiter: RateLimiterAbstract,
  key: string
): Promise<RateLimiterRes | undefined> {
  try {
    await limiter.consume(key);
  } catch (rejection) {
    // Any other error means the store failed and there is no insurance
    // limiter: serve the request rather than turn a Redis outage into an API
    // outage.
    return rejection instanceof RateLimiterRes ? rejection : undefined;
  }
}

function reject(res: Response, reason: string, rejection: RateLimiterRes) {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(rejection.msBeforeNext / 1000)
  );

  res.set("Retry-After", String(retryAfterSeconds));
  res
    .status(429)
    .json(createTooManyRequestsBody({ reason, retryAfterSeconds }));
}

// An IPv4 client reaching a dual-stack socket shows up as ::ffff:a.b.c.d.
function normalizeIp(ip: string): string {
  return ip.startsWith("::ffff:") && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip;
}

export function buildAllowlist(cidrs: string[]): BlockList {
  const list = new BlockList();

  for (const cidr of cidrs.map((c) => c.trim()).filter(Boolean)) {
    const [address = "", prefix] = cidr.split("/");
    const version = isIP(address);

    if (!version) {
      throw new Error(`Invalid rate limit allowlist entry: "${cidr}"`);
    }

    const type = version === 4 ? "ipv4" : "ipv6";
    const bits =
      prefix === undefined ? (version === 4 ? 32 : 128) : Number(prefix);

    list.addSubnet(address, bits, type);
  }

  return list;
}

export function isAllowlisted(list: BlockList, ip: string): boolean {
  const address = normalizeIp(ip);
  const version = isIP(address);

  return version !== 0 && list.check(address, version === 4 ? "ipv4" : "ipv6");
}

/**
 * Per-client-IP rate limits. The client IP is `req.ip`, so it is only right
 * behind a proxy when TRUSTED_PROXIES covers that proxy.
 *
 * Two independent budgets, both skipped for allowlisted addresses:
 * - `limiter`: every route shares one budget per client.
 * - `repeatLimiter`: one budget per client and resource, for single-resource
 *   lookups only.
 *
 * The counters live wherever the limiters keep them; with a Redis store they
 * are shared by every instance, which is what makes the limit exact when the
 * API runs behind more than one ingress controller or replica.
 */
export function createRateLimitMiddleware({
  limiter,
  repeatLimiter,
  allowlist,
}: RateLimitOptions): RequestHandler {
  const allowed = buildAllowlist(allowlist);

  return (req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress;

    if (!ip || isAllowlisted(allowed, ip)) {
      return next();
    }

    const client = normalizeIp(ip);

    void (async () => {
      const overall = limiter && (await consume(limiter, client));

      if (overall) {
        return reject(
          res,
          `Too many requests from your address (limit: ${
            limiter.points
          } per ${describeWindow(limiter.duration)}).`,
          overall
        );
      }

      const resource = repeatLimiter && getResourcePath(req);
      const repeated =
        repeatLimiter &&
        resource &&
        (await consume(repeatLimiter, `${client}:${resource}`));

      if (repeated) {
        return reject(
          res,
          `This resource was requested more than ${
            repeatLimiter.points
          } times in ${describeWindow(
            repeatLimiter.duration
          )} from your address.`,
          repeated
        );
      }

      next();
    })();
  };
}
