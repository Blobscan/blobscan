// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { env } from "~/env.mjs";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN_WEB,
  environment: env.NEXT_PUBLIC_NETWORK_NAME,
  tracesSampleRate: 1,
  debug: false,
});
