import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter, createTRPCContext } from "@blobscan/api";

// Handle incoming tRPC requests
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
});
