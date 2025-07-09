import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./app-router";

export * from "@trpc/server/adapters/express";

export { appRouter, type AppRouter } from "./app-router";
export { createTRPCContext, createTRPCInnerContext } from "./context";
export type {
  TRPCInnerContext as TRCInnerContext,
  TRPCContext,
} from "./context";

export { metricsHandler } from "./instrumentation";

export { searchByTerm } from "./routers/search/byTerm";

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
