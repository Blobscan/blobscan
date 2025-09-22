import { captureException } from "@sentry/nextjs";

import { createNextApiHandler } from "@blobscan/api";

import { appRouter, createContext } from "~/trpc";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    captureException(error);

    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(error);
    }
  },
});
