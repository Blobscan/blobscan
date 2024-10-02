import { PostHog } from "posthog-node";

import { env } from "@blobscan/env";

let posthog: PostHog | null = null;

if (env.POSTHOG_KEY && env.POSTHOG_HOST) {
  posthog = new PostHog(env.POSTHOG_KEY, { host: env.POSTHOG_HOST });
}

export { posthog };
