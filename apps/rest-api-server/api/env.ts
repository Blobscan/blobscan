import z from "zod";

import { createEnvSchema } from "@blobscan/zod";

const envSchema = createEnvSchema({
  BLOBSCAN_API_PORT: {
    schema: z.coerce.number().int().positive(),
    default: 3001,
  },
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
