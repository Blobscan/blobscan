import type { z } from "zod";

import { createEnvSchema } from "@blobscan/zod";

const envSchema = createEnvSchema({
  SECRET_KEY: { default: "supersecret" },
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
