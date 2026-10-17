import type { RequestHandler } from "express";
import { BlockList, isIP } from "node:net";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { RateLimiterRes } from "rate-limiter-flexible";

export type RateLimitOptions = {
  /** One budget per client IP, shared by every route. */
  limiter: RateLimiterAbstract;
  /** CIDRs never limited, e.g. callers inside the cluster. */
  allowlist: string[];
};

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
 * Per-client-IP rate limit. The client IP is `req.ip`, so it is only right
 * behind a proxy when TRUSTED_PROXIES covers that proxy.
 *
 * Every route shares one budget. The counters live wherever `limiter` keeps
 * them; with a Redis store they are shared by every instance, which is what
 * makes the limit exact when the API runs behind more than one ingress
 * controller or replica.
 */
export function createRateLimitMiddleware({
  limiter,
  allowlist,
}: RateLimitOptions): RequestHandler {
  const allowed = buildAllowlist(allowlist);

  return (req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress;

    if (!ip || isAllowlisted(allowed, ip)) {
      return next();
    }

    limiter.consume(normalizeIp(ip)).then(
      () => next(),
      (rejection: unknown) => {
        if (rejection instanceof RateLimiterRes) {
          const retryAfter = Math.max(
            1,
            Math.ceil(rejection.msBeforeNext / 1000)
          );

          res.set("Retry-After", String(retryAfter));
          res.status(429).json({
            message: `Too many requests, retry after ${retryAfter} second(s)`,
          });

          return;
        }

        // The store failed and there is no insurance limiter: serve the
        // request rather than turn a Redis outage into an API outage.
        next();
      }
    );
  };
}
