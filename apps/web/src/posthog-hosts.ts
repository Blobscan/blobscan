/**
 * Path of the relay that forwards the PostHog requests of the browser (see
 * `pages/api/relay/[...path].ts`). Requests to this site are not dropped by
 * the ad blockers that block the PostHog hosts.
 */
export const POSTHOG_PROXY_PATH = "/api/relay";

// PostHog Cloud ingestion hosts, e.g. `https://us.i.posthog.com`.
const POSTHOG_CLOUD_HOSTNAME = /^(us|eu)\.i\.posthog\.com$/;

function getCloudRegion(hostname: string): string | undefined {
  return hostname.match(POSTHOG_CLOUD_HOSTNAME)?.[1];
}

/**
 * PostHog Cloud serves the SDK scripts and the remote config from a separate
 * assets host. A self-hosted instance serves everything from its own host.
 */
export function getPostHogAssetsOrigin(host: string): string {
  const { hostname, origin } = new URL(host);
  const region = getCloudRegion(hostname);

  return region ? `https://${region}-assets.i.posthog.com` : origin;
}

/**
 * The PostHog app, used by the SDK for links (e.g. the toolbar) when the
 * requests go through the relay.
 */
export function getPostHogUiHost(host: string): string {
  const { hostname, origin } = new URL(host);
  const region = getCloudRegion(hostname);

  return region ? `https://${region}.posthog.com` : origin;
}

// First path segments of the requests of the SDK.
const API_SEGMENTS = new Set(["e", "i", "batch", "capture", "decide", "flags"]);
const ASSET_SEGMENTS = new Set(["static", "array"]);

function getFirstSegment(pathname: string): string {
  return pathname.split("/")[1] ?? "";
}

/**
 * The PostHog URL for a request to the relay, or `undefined` when the path is
 * not one that the SDK uses: the relay must not reach other endpoints of the
 * PostHog host.
 */
export function getUpstreamUrl(
  requestUrl: string,
  host: string
): URL | undefined {
  if (!requestUrl.startsWith(`${POSTHOG_PROXY_PATH}/`)) {
    return;
  }

  const pathAndQuery = requestUrl.slice(POSTHOG_PROXY_PATH.length);
  const segment = getFirstSegment(pathAndQuery.split("?")[0] ?? "");
  let origin: string;

  if (ASSET_SEGMENTS.has(segment)) {
    origin = getPostHogAssetsOrigin(host);
  } else if (API_SEGMENTS.has(segment)) {
    origin = new URL(host).origin;
  } else {
    return;
  }

  const upstreamUrl = new URL(pathAndQuery, origin);

  // `URL` resolves `..` and `%2e%2e`: check the path again after it.
  if (getFirstSegment(upstreamUrl.pathname) !== segment) {
    return;
  }

  return upstreamUrl;
}
