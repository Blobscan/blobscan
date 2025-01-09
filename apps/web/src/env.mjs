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
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    FEEDBACK_WEBHOOK_URL: process.env.FEEDBACK_WEBHOOK_URL,
    METRICS_ENABLED: process.env.METRICS_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
    TRACES_ENABLED: process.env.TRACES_ENABLED,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
