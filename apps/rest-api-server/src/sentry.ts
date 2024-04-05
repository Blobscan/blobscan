import * as Sentry from "@sentry/node";

import { env } from "./env";

export function initializeSentry() {
  if (!!env.SENTRY_DSN_API) {
    Sentry.init({
      dsn: env.SENTRY_DSN_API,
      tracesSampleRate: 1.0,
    });
  }
}
