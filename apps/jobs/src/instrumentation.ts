import * as Sentry from "@sentry/node";

import { env } from "@blobscan/env";

Sentry.init({
  dsn: env.SENTRY_DSN_JOBS,
});
