import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { stateRouter } from "./src/routers/state";
import { createSharedAppRouter } from "./src/shared-app-router";
import { t } from "./src/trpc-client";

const sharedAppRouter = createSharedAppRouter();

export const appRouter = t.mergeRouters(
  sharedAppRouter,
  t.router({
    state: stateRouter,
  })
);

export type AppRouter = typeof appRouter;

export { searchByTerm } from "./src/routers/search/byTerm";

export type AppRouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
