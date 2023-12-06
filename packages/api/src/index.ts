import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./app-router";

export { appRouter, type AppRouter } from "./app-router";
export { createTRPCContext, createTRPCInnerContext } from "./context";
export type {
  TRPCInnerContext as TRCInnerContext,
  TRPCContext,
} from "./context";

export * from "@trpc/server/adapters/express";

export { env } from "./env";
export { gracefulShutdown } from "./graceful-shutdown";
export { metricsHandler } from "./instrumentation";
export type {
  Metric,
  MetricHistogram,
  MetricHistogramBucket,
  Metrics,
  MetricsClient,
} from "@blobscan/db";

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
