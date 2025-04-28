import { httpLink, loggerLink } from "@trpc/client";
import { createTRPCProxyClient } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";

import type { AppRouter } from "@blobscan/api";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:3000`; // dev SSR should use localhost
};

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
        // TODO: support batching link via a conditional link so when a flag is provided it uses the batching link
        // httpBatchLink({
        //   url: `${getBaseUrl()}/api/trpc`,
        // }),
      ],
    };
  },
  ssr: false,
});

export const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});

export { type RouterInputs, type RouterOutputs } from "@blobscan/api";
