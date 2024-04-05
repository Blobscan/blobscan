import * as Sentry from "@sentry/nextjs";
import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter, createTRPCContext } from "@blobscan/api";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext({
    scope: "web",
  }),
  onError({ error }) {
    Sentry.captureException(error);

    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(error);
    }
  },
});
