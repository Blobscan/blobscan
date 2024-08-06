import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import packageJson from "../package.json" assert { type: "json" }

// See booleanSchema from packages/zod/src/schemas.ts
// We need to redefine it because we can't import ts files from here
const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

const networkSchema = z.enum([
  "mainnet",
  "holesky",
  "sepolia",
  "gnosis",
  "chiado",
  "devnet",
]);

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    TRACES_ENABLED: booleanSchema.default("false"),
    METRICS_ENABLED: booleanSchema.default("false"),
    FEEDBACK_WEBHOOK_URL: z.string().optional(),
  },
  /**
   * Specify your client-side environment variables schema here.ç
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: booleanSchema.default("false"),
    NEXT_PUBLIC_NETWORK_NAME: networkSchema.default("mainnet"),
    NEXT_PUBLIC_SUPPORTED_NETWORKS: z
      .string()
      .default(
        '[{"label":"Mainnet","href":"https://blobscan.com/"},{"label":"Holesky","href":"https://holesky.blobscan.com/"},{"label":"Sepolia","href":"https://sepolia.blobscan.com/"}]'
      ),
    NEXT_PUBLIC_EXPLORER_BASE_URL: z
      .string()
      .url()
      .default("https://etherscan.io/"),
    NEXT_PUBLIC_BEACON_BASE_URL: z
      .string()
      .url()
      .default("https://beaconcha.in/"),
    NEXT_PUBLIC_VERSION: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN_WEB: z.string().url().optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    FEEDBACK_WEBHOOK_URL: process.env.FEEDBACK_WEBHOOK_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED:
      process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED,
    NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
    NEXT_PUBLIC_SUPPORTED_NETWORKS: process.env.NEXT_PUBLIC_SUPPORTED_NETWORKS,
    NEXT_PUBLIC_EXPLORER_BASE_URL: process.env.NEXT_PUBLIC_EXPLORER_BASE_URL,
    NEXT_PUBLIC_BEACON_BASE_URL: process.env.NEXT_PUBLIC_BEACON_BASE_URL,
    NEXT_PUBLIC_VERSION: packageJson.version,
    NEXT_PUBLIC_SENTRY_DSN_WEB: process.env.NEXT_PUBLIC_SENTRY_DSN_WEB,
    TRACES_ENABLED: process.env.TRACES_ENABLED,
    METRICS_ENABLED: process.env.METRICS_ENABLED,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
