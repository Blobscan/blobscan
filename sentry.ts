import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN_API;

export async function monitorJob(jobName: string, jobFn: () => Promise<void>) {
  if (!SENTRY_DSN) {
    await jobFn();

    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });

  Sentry.configureScope(function (scope) {
    scope.setContext("monitor", {
      slug: jobName,
    });
  });

  const checkInId = Sentry.captureCheckIn({
    monitorSlug: jobName,
    status: "in_progress",
  });

  try {
    await jobFn();

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: jobName,
      status: "ok",
    });
  } catch (err) {
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: jobName,
      status: "error",
    });

    throw err;
  }
}
