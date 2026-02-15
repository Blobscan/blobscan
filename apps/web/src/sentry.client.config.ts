// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  init as SentryInit,
  captureRouterTransitionStart,
} from "@sentry/nextjs";

import type { z } from "@blobscan/zod";

import type { clientEnvVarsSchema } from "~/env";

type ClientEnvVars = z.output<typeof clientEnvVarsSchema>;

const initSentry = async () => {
  try {
    const request = await fetch("/api/env");
    const env = (await request.json()) as ClientEnvVars;

    const dns = env.PUBLIC_SENTRY_DSN_WEB;
    const environment = env.PUBLIC_NETWORK_NAME;

    SentryInit({
      dsn: dns,
      environment,
      // Adds request headers and IP for users
      sendDefaultPii: true,
      // Adjust based on your traffic volume
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
      enableLogs: true,
    });
  } catch (error) {
    console.error("Error during Sentry initialization", error);
  }
};

initSentry();

export const onRouterTransitionStart = captureRouterTransitionStart;
