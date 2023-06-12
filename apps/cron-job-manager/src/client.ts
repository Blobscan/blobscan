import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { type AppRouter } from "@blobscan/api";

import { BLOBSCAN_API_ENDPOINT } from "./env";

export const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BLOBSCAN_API_ENDPOINT}/api/trpc`,
    }),
  ],
  transformer: superjson,
});
