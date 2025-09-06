import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const networkSchema = z.enum([
  "mainnet",
  "holesky",
  "hoodi",
  "sepolia",
  "gnosis",
  "devnet",
]);

// See booleanSchema from packages/zod/src/schemas.ts
// We need to redefine it because we can't import ts files from here
const booleanSchema = z
  .string()
  .refine((s) => s === "true" || s === "false")
  .transform((s) => s === "true");

const clientEnvVars = {
  PUBLIC_BEACON_BASE_URL: z.string().url().optional(),
  PUBLIC_EXPLORER_BASE_URL: z.string().url().optional(),
  PUBLIC_NETWORK_NAME: networkSchema.default("mainnet"),
  PUBLIC_SENTRY_DSN_WEB: z.string().url().optional(),
  PUBLIC_POSTHOG_ID: z.string().optional(),
  PUBLIC_POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),
  PUBLIC_VERCEL_ANALYTICS_ENABLED: booleanSchema.default("false"),
};

export const clientEnvVarsSchema = z.object(clientEnvVars);

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    CHAIN_ID: z.coerce.number().positive().default(1),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    FEEDBACK_WEBHOOK_URL: z.string().optional(),
    BLOB_DATA_API_ENABLED: booleanSchema.default("true"),
    BLOB_DATA_API_KEY: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    METRICS_ENABLED: booleanSchema.default("false"),
    REDIS_URI: z.string().default("redis://localhost:6379"),
    TRACES_ENABLED: booleanSchema.default("false"),
    OTEL_DIAG_ENABLED: z.boolean().default(false),
    OTLP_AUTH_USERNAME: z.coerce.string().optional(),
    OTLP_AUTH_PASSWORD: z.string().optional(),
    ...clientEnvVars,
  },
  client: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: z.string().optional(),
    NEXT_PUBLIC_BLOBSCAN_RELEASE: z.string().optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    CHAIN_ID: process.env.CHAIN_ID,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    FEEDBACK_WEBHOOK_URL: process.env.FEEDBACK_WEBHOOK_URL,
    BLOB_DATA_API_ENABLED: process.env.BLOB_DATA_API_ENABLED,
    BLOB_DATA_API_KEY: process.env.BLOB_DATA_API_KEY,
    METRICS_ENABLED: process.env.METRICS_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URI: process.env.REDIS_URI,
    TRACES_ENABLED: process.env.TRACES_ENABLED,
    OTEL_DIAG_ENABLED: process.env.OTEL_DIAG_ENABLED,
    OTLP_AUTH_USERNAME: process.env.OTLP_AUTH_USERNAME,
    OTLP_AUTH_PASSWORD: process.env.OTLP_AUTH_PASSWORD,

    PUBLIC_BEACON_BASE_URL: process.env.PUBLIC_BEACON_BASE_URL,
    PUBLIC_EXPLORER_BASE_URL: process.env.PUBLIC_EXPLORER_BASE_URL,
    PUBLIC_NETWORK_NAME: process.env.PUBLIC_NETWORK_NAME,
    PUBLIC_POSTHOG_HOST: process.env.PUBLIC_POSTHOG_HOST,
    PUBLIC_POSTHOG_ID: process.env.PUBLIC_POSTHOG_ID,
    PUBLIC_SENTRY_DSN_WEB: process.env.PUBLIC_SENTRY_DSN_WEB,
    PUBLIC_VERCEL_ANALYTICS_ENABLED:
      process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED,

    NEXT_PUBLIC_BLOBSCAN_RELEASE: process.env.NEXT_PUBLIC_BLOBSCAN_RELEASE,
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
