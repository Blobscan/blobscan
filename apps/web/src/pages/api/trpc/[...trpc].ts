import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter, createTRPCContext } from "@blobscan/api";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext({
    scope: "web",
    enableBlobPropagator: false,
  }),
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(error);
    }
  },
});
