import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { booleanSchema, optionalStringSchema } from "@blobscan/zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    BEACON_NODE_ENDPOINT: optionalStringSchema(
      z.string().url(),
      "http://localhost:5052"
    ),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OTEL_BLOBSCAN_WEB_ENABLED: booleanSchema(),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_EXPLORER_BASE_URL: z.string().url(),
    NEXT_PUBLIC_BEACON_BASE_URL: z.string().url(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    BEACON_NODE_ENDPOINT: process.env.BEACON_NODE_ENDPOINT,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_EXPLORER_BASE_URL: process.env.NEXT_PUBLIC_EXPLORER_BASE_URL,
    NEXT_PUBLIC_BEACON_BASE_URL: process.env.NEXT_PUBLIC_BEACON_BASE_URL,
    OTEL_BLOBSCAN_WEB_ENABLED: process.env.OTEL_BLOBSCAN_WEB_ENABLED,
  },
});
