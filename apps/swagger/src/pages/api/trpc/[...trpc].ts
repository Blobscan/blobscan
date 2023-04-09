import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter, createTRPCContext } from "@blobscan/openapi";

// Handle incoming tRPC requests
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
});
