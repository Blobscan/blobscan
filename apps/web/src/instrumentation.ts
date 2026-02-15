import { captureRequestError } from "@sentry/nextjs";

// Next.js calls this function when the server starts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!!process.env.TRACES_ENABLED || !!process.env.METRICS_ENABLED) {
      await import("./instrumentation.node");
    }

    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = captureRequestError;
