// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { fetchEnv } from "~/utils/env";

const initSentry = async () => {
  const res = await fetchEnv();
  const env = res?.result?.data?.json as Record<string, string>;

  Sentry.init({
    dsn: env["NEXT_PUBLIC_SENTRY_DSN_WEB"],
    environment: env["NEXT_PUBLIC_NETWORK_NAME"],
    tracesSampleRate: 1,
    debug: false,
  });
};

initSentry();
