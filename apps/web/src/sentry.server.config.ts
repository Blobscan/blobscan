// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init as SentryInit } from "@sentry/nextjs";

import { env } from "./env";

SentryInit({
  dsn: env.PUBLIC_SENTRY_DSN_WEB,
  environment: env.PUBLIC_NETWORK_NAME,
  dataCollection: {
    userInfo: true,
    httpHeaders: { request: true, response: true },
  },
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});
