import * as Sentry from "@sentry/nextjs";

import { createTRPCContext } from "@blobscan/api";
import { createNextApiHandler } from "@blobscan/api";
import { appRouter } from "@blobscan/api";

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
