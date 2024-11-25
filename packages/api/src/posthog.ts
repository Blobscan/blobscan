import { PostHog } from "posthog-node";

import { env } from "@blobscan/env";

export function PostHogClient(): PostHog | null {
  if (!env.POSTHOG_ID) {
    return null;
  }

  return new PostHog(env.POSTHOG_ID, {
    host: env.POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

const POSTHOG_IGNORED_ENDPOINTS = [
  "/blockchain-sync-stat",
  "/indexer",
];

export function shouldIgnoreURL(url: string | undefined) {
  if (url === undefined) {
    return false;
  }

  for (const endpoint of POSTHOG_IGNORED_ENDPOINTS) {
    if (url.includes(endpoint)) {
      return true;
    }
  }

  return false;
}
