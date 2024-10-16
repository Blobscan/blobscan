import { PostHog } from "posthog-node";

import { env } from "@blobscan/env";

let posthog: PostHog | null = null;

if (env.POSTHOG_ID) {
  posthog = new PostHog(env.POSTHOG_ID, { host: env.POSTHOG_HOST });
}

export { posthog };
