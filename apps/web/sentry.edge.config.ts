// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init as SentryInit } from "@sentry/nextjs";

import { env } from "./src/env.mjs";

SentryInit({
  dsn: env.PUBLIC_SENTRY_DSN_WEB,
  environment: env.PUBLIC_NETWORK_NAME,
  tracesSampleRate: 1,
  debug: false,
});
