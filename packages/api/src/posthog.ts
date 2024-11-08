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
