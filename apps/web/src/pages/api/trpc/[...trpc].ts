import { captureException } from "@sentry/nextjs";

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
    captureException(error);

    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(error);
    }
  },
});
