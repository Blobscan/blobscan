import MatomoTracker from "matomo-tracker";

import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

let matomoTracker: MatomoTracker | undefined;

export function createOrGetMatomoTracker() {
  if (!matomoTracker) {
    try {
      if (!env.MATOMO_SITE_ID || !env.MATOMO_URL) {
        throw new Error("MATOMO_SITE_ID and MATOMO_URL are required");
      }

      matomoTracker = new MatomoTracker(env.MATOMO_SITE_ID, env.MATOMO_URL);
    } catch (error) {
      logger.error("Failed to create Matomo tracker", error);

      throw error;
    }
  }

  return matomoTracker;
}
