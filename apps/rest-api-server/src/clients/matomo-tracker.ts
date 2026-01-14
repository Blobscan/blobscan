import MatomoTracker from "matomo-tracker";

import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

let matomoTracker: MatomoTracker | undefined;

if (env.MATOMO_ENABLED) {
  try {
    if (!env.MATOMO_SITE_ID) {
      logger.warn(
        "MATOMO_ENABLED is true but MATOMO_SITE_ID or MATOMO_URL is not set"
      );
    } else if (!env.MATOMO_URL) {
      logger.warn("MATOMO_ENABLED is true but MATOMO_URL is not set");
    } else {
      matomoTracker = new MatomoTracker(env.MATOMO_SITE_ID, env.MATOMO_URL);
    }
  } catch (error) {
    logger.warn("Failed to create Matomo Tracker client", error);
  }
}

export { matomoTracker };
