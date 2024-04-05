// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { env } from "~/env.mjs";

Sentry.init({
  dsn: env.SENTRY_DSN_WEB,
  tracesSampleRate: 1,
  debug: false,
});
