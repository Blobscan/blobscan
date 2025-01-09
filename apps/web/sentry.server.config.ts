// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javasccript/guides/nextjs/

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
