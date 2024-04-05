import * as Sentry from "@sentry/node";

import { env } from "./src/env";

Sentry.init({
  dsn: env.SENTRY_DSN_API,
  tracesSampleRate: 1.0,
});
