import { PostHog } from "posthog-node";

import { env } from "@blobscan/env";

export const posthog = new PostHog(env.POSTHOG_KEY, {
  host: env.POSTHOG_HOST,
});
