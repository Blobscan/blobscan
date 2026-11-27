import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env";
import { getUpstreamUrl } from "~/posthog-hosts";
import { getClientIp } from "~/rate-limit";

/**
 * Forwards the PostHog requests of the browser to `PUBLIC_POSTHOG_HOST`, so
 * that ad blockers that block the PostHog hosts do not drop them. It reads the
 * host at runtime: a Next.js rewrite would fix it at build time.
 *
 * It only forwards the paths that the SDK uses, so that it cannot be used to
 * reach other endpoints of the PostHog host.
 */

export const config = {
  // Forward the body as it is: the SDK sends compressed batches.
  api: { bodyParser: false },
};

// Event batches are small: session recordings, the largest requests, are
// disabled.
const MAX_BODY_BYTES = 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 10_000;
const ALLOWED_METHODS = ["GET", "HEAD", "POST"];

const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "user-agent",
  "accept",
  "accept-language",
];
// Not `content-encoding` or `content-length`: `fetch` decompresses the body.
// Not `set-cookie`: the analytics must not set cookies on this site.
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
];

class BodyTooLargeError extends Error {}

async function readBody(
  req: NextApiRequest
): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (req.method === "GET" || req.method === "HEAD") {
    return;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    size += buffer.length;

    if (size > MAX_BODY_BYTES) {
      throw new BodyTooLargeError();
    }

    chunks.push(buffer);
  }

  return Uint8Array.from(Buffer.concat(chunks));
}

export default async function relay(req: NextApiRequest, res: NextApiResponse) {
  if (!env.PUBLIC_POSTHOG_ID || !env.PUBLIC_POSTHOG_PROXY_ENABLED) {
    return res.status(404).json({ message: "Not found" });
  }

  if (!ALLOWED_METHODS.includes(req.method ?? "")) {
    res.setHeader("Allow", ALLOWED_METHODS.join(", "));

    return res.status(405).json({ message: "Method not allowed" });
  }

  const upstreamUrl = req.url
    ? getUpstreamUrl(req.url, env.PUBLIC_POSTHOG_HOST)
    : undefined;

  if (!upstreamUrl) {
    return res.status(404).json({ message: "Not found" });
  }

  let body: Uint8Array<ArrayBuffer> | undefined;

  try {
    body = await readBody(req);
  } catch (err) {
    if (err instanceof BodyTooLargeError) {
      return res.status(413).json({ message: "Request body too large" });
    }

    return res.status(400).json({ message: "Could not read the request" });
  }

  const headers: Record<string, string> = {};

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers[name];

    if (typeof value === "string") {
      headers[name] = value;
    }
  }

  // PostHog finds the location of the user from the IP address.
  const clientIp = getClientIp(req);

  if (clientIp) {
    headers["x-forwarded-for"] = clientIp;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);

      if (value) {
        res.setHeader(name, value);
      }
    }

    res.status(upstream.status);

    if (req.method === "HEAD") {
      return res.end();
    }

    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error("PostHog relay request failed:", err);

    return res.status(502).json({ message: "Analytics relay failed" });
  }
}
