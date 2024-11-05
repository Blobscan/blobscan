import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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
    FEEDBACK_WEBHOOK_URL: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    METRICS_ENABLED: booleanSchema.default("false"),
    TRACES_ENABLED: booleanSchema.default("false"),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_BEACON_BASE_URL: z
      .string()
      .url()
      .default("https://beaconcha.in/"),
    NEXT_PUBLIC_BLOBSCAN_RELEASE: z.string().optional(),
    NEXT_PUBLIC_EXPLORER_BASE_URL: z
      .string()
      .url()
      .default("https://etherscan.io/"),
    NEXT_PUBLIC_NETWORK_NAME: networkSchema.default("mainnet"),
    NEXT_PUBLIC_SENTRY_DSN_WEB: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_ID: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),
    NEXT_PUBLIC_SUPPORTED_NETWORKS: z
      .string()
      .default(
        '[{"label":"Ethereum Mainnet","href":"https://blobscan.com/"},{"label":"Gnosis","href":"https://gnosis.blobscan.com/"},{"label":"Holesky Testnet","href":"https://holesky.blobscan.com/"},{"label":"Sepolia Testnet","href":"https://sepolia.blobscan.com/"}]'
      ),
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: booleanSchema.default("false"),
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    FEEDBACK_WEBHOOK_URL: process.env.FEEDBACK_WEBHOOK_URL,
    METRICS_ENABLED: process.env.METRICS_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
    TRACES_ENABLED: process.env.TRACES_ENABLED,

    NEXT_PUBLIC_BLOBSCAN_RELEASE: process.env.NEXT_PUBLIC_BLOBSCAN_RELEASE,
    NEXT_PUBLIC_BEACON_BASE_URL: process.env.NEXT_PUBLIC_BEACON_BASE_URL,
    NEXT_PUBLIC_EXPLORER_BASE_URL: process.env.NEXT_PUBLIC_EXPLORER_BASE_URL,
    NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_ID: process.env.NEXT_PUBLIC_POSTHOG_ID,
    NEXT_PUBLIC_SENTRY_DSN_WEB: process.env.NEXT_PUBLIC_SENTRY_DSN_WEB,
    NEXT_PUBLIC_SUPPORTED_NETWORKS: process.env.NEXT_PUBLIC_SUPPORTED_NETWORKS,
    NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED:
      process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED,
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
