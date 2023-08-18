import {
  z,
  chainIdSchema,
  booleanSchema,
  createEnvSchema,
} from "@blobscan/zod";

const envSchema = createEnvSchema({
  BEE_DEBUG_ENDPOINT: { schema: z.string().url(), optional: true },
  BEE_ENDPOINT: { schema: z.string().url(), optional: true },
  CHAIN_ID: { schema: chainIdSchema(), default: 7011893058 },
  GOOGLE_STORAGE_BUCKET_NAME: { optional: true },
  GOOGLE_STORAGE_PROJECT_ID: { optional: true },
  GOOGLE_SERVICE_KEY: { optional: true },
  GOOGLE_STORAGE_API_ENDPOINT: {
    schema: z.string().url(),
    optional: true,
  },
  GOOGLE_STORAGE_ENABLED: { schema: booleanSchema(), default: false },
  POSTGRES_STORAGE_ENABLED: { schema: booleanSchema(), default: true },
  SWARM_STORAGE_ENABLED: { schema: booleanSchema(), default: false },
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
