import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    // See booleanSchema from packages/zod/src/schemas.ts
    TRACES_ENABLED: z
      .string()
      .refine((s) => s === "true" || s === "false")
      .transform((s) => s === "true")
      .default("false"),
    FEEDBACK_WEBHOOK_URL: z.string().optional(),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_NETWORK_NAME: z.string().default("Ethereum"),
    NEXT_PUBLIC_EXPLORER_BASE_URL: z
      .string()
      .url()
      .default("https://etherscan.io/"),
    NEXT_PUBLIC_BEACON_BASE_URL: z
      .string()
      .url()
      .default("https://beaconcha.in/"),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    FEEDBACK_WEBHOOK_URL: process.env.FEEDBACK_WEBHOOK_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
    NEXT_PUBLIC_EXPLORER_BASE_URL: process.env.NEXT_PUBLIC_EXPLORER_BASE_URL,
    NEXT_PUBLIC_BEACON_BASE_URL: process.env.NEXT_PUBLIC_BEACON_BASE_URL,
    TRACES_ENABLED: process.env.TRACES_ENABLED,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});

function printBanner() {
  console.log(" ____  _       _");
  console.log("| __ )| | ___ | |__  ___  ___ __ _ _ __");
  console.log("|  _ \\| |/ _ \\| '_ \\/ __|/ __/ _` | '_ \\");
  console.log("| |_) | | (_) | |_) \\__ \\ (_| (_| | | | |");
  console.log("|____/|_|\\___/|_.__/|___/\\___\\__,_|_| |_|");
  console.log("Blobscan Web UI (EIP-4844 blob explorer) - blobscan.com");
  console.log("=======================================================\n");

  console.log(`Network: name=${env.NEXT_PUBLIC_NETWORK_NAME}, explorer=${env.NEXT_PUBLIC_EXPLORER_BASE_URL}, beaconExplorer=${env.NEXT_PUBLIC_BEACON_BASE_URL}`);
}

printBanner();
