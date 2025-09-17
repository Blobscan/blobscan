import { createAppRouter } from "@blobscan/api";
import { env } from "@blobscan/env";

export const appRouter = createAppRouter({
  blobRouter: {
    blobDataProcedure: {
      enabled: env.BLOB_DATA_API_ENABLED,
      protected: !!env.BLOB_DATA_API_KEY?.length,
    },
  },
});
