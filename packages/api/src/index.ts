import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

export { appRouter, type AppRouter } from "./root";
export { createTRPCContext, createTRPCInnerContext } from "./context";
export type {
  TRPCInnerContext as TRCInnerContext,
  TRPCContext,
} from "./context";

export * from "@trpc/server/adapters/express";

export { getPrismaMetricsClient } from "./instrumentation";
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
