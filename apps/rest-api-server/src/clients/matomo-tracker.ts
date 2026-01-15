import { env } from "@blobscan/env";
import type { ErrorCause } from "@blobscan/errors";
import { ErrorException } from "@blobscan/errors";
import { logger } from "@blobscan/logger";

class MatomoTrackerError extends ErrorException {
  constructor(message: string, cause: ErrorCause) {
    super(message, cause);
  }
}

interface TrackOptions {
  url?: string;
  action_name?: string;
  ua?: string;
  cip?: string;
  cvar?: string;
  cvar2?: string;
  lang?: string;
  pf_srv?: string;
  token_auth?: string;
}
class MatomoTracker {
  private readonly siteId: string;
  private readonly url: string;

  constructor(siteId: string | number, url: string) {
    this.siteId = siteId.toString();
    this.url = url;
  }

  async track(options: TrackOptions) {
    const queryParams = new URLSearchParams({
      idsite: this.siteId,
      rec: "1",
      ...options,
    });

    try {
      await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: queryParams.toString(),
      });
    } catch (error) {
      throw new MatomoTrackerError("Failed to track event", error as Error);
    }
  }
}

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
