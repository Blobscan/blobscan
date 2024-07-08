import {
  z,
  blobStorageSchema,
  booleanSchema,
  conditionalRequiredSchema,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
  maskPassword,
  networkSchema,
  maskSensitiveData,
  prismaBatchOperationsMaxSizeSchema,
} from "@blobscan/zod";

export function requiredStorageConfigSchema<T extends z.ZodTypeAny>(
  storageName: "FILE_SYSTEM" | "GOOGLE" | "POSTGRES" | "SWARM",
  schema: T
) {
  return conditionalRequiredSchema(
    schema,
    process.env[`${storageName}_STORAGE_ENABLED`],
    "true",
    `This configuration variable is required when ${storageName} storage is enabled.`
  );
}

export const env = createEnv({
  envOptions: {
    server: {
      BEE_DEBUG_ENDPOINT: z.string().url().optional(),
      BEE_ENDPOINT: requiredStorageConfigSchema("SWARM", z.string().url()),
      BLOBSCAN_API_BASE_URL: z
        .string()
        .url()
        .default("https://api.blobscan.com"),
      BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
      BLOB_PROPAGATOR_ENABLED: booleanSchema.default("false"),
      BLOB_PROPAGATOR_TMP_BLOB_STORAGE:
        blobStorageSchema.default("FILE_SYSTEM"),
      BLOB_PROPAGATOR_COMPLETED_JOBS_AGE: z.coerce
        .number()
        .default(24 * 60 * 60),
      BLOB_PROPAGATOR_FAILED_JOBS_AGE: z.coerce
        .number()
        .default(7 * 24 * 60 * 60),
      CHAIN_ID: z.coerce.number().positive().default(1),
      DENCUN_FORK_SLOT: z.coerce.number().optional(),
      FILE_SYSTEM_STORAGE_ENABLED: booleanSchema.default("false"),
      FILE_SYSTEM_STORAGE_PATH: z.string().default("/tmp/blobscan-blobs"),
      GOOGLE_STORAGE_API_ENDPOINT: z.string().optional(),
      GOOGLE_STORAGE_BUCKET_NAME: requiredStorageConfigSchema(
        "GOOGLE",
        z.string()
      ),
      GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
      GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
      GOOGLE_SERVICE_KEY: z.string().optional(),
      LOG_LEVEL: z
        .enum(["debug", "http", "info", "warn", "error"])
        .default("http"),
      METRICS_ENABLED: booleanSchema.default("false"),
      NETWORK_NAME: networkSchema.default("mainnet"),
      NODE_ENV: nodeEnvSchema.optional(),
      OTEL_EXPORTER_OTLP_PROTOCOL: z
        .enum(["grpc", "http/protobuf", "http/json"])
        .default("http/protobuf"),
      OTEL_EXPORTER_OTLP_ENDPOINT: z
        .string()
        .url()
        .default("http://localhost:4318"),
      OTEL_DIAG_ENABLED: z.boolean().default(false),
      OTLP_AUTH_USERNAME: z.coerce.string().optional(),
      OTLP_AUTH_PASSWORD: z.string().optional(),
      POSTGRES_STORAGE_ENABLED: booleanSchema.default("false"),
      PRISMA_BATCH_OPERATIONS_MAX_SIZE: prismaBatchOperationsMaxSizeSchema,
      REDIS_URI: z.string().default("redis://localhost:6379"),
      STATS_SYNCER_DAILY_CRON_PATTERN: z.string().default("30 0 * * * *"),
      STATS_SYNCER_OVERALL_CRON_PATTERN: z.string().default("*/15 * * * *"),
      SECRET_KEY: z.string(),
      SENTRY_DSN_API: z.string().optional(),
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
      SWARM_STAMP_CRON_PATTERN: z.string().default("*/15 * * * *"),
      SWARM_BATCH_ID: z.string().optional(),
      TEST: booleanSchema.optional(),
      TRACES_ENABLED: booleanSchema.default("false"),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `API configuration: secretKey: ${maskSensitiveData(
        env.SECRET_KEY
      )} Blob propagator configuration: enabled=${
        env.BLOB_PROPAGATOR_ENABLED
      } redisUri=${maskPassword(env.REDIS_URI)} temporalBlobStorage=${
        env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
      } completedJobsAge=${
        env.BLOB_PROPAGATOR_COMPLETED_JOBS_AGE
      } seconds failedJobsAge=${
        env.BLOB_PROPAGATOR_FAILED_JOBS_AGE
      } seconds Configuration: network=${
        env.NETWORK_NAME
      } sentryEnabled=${!!env.SENTRY_DSN_API} metrics=${
        env.METRICS_ENABLED
      } traces=${env.TRACES_ENABLED} port=${
        env.BLOBSCAN_API_PORT
      } dailyStatsCron=${
        env.STATS_SYNCER_DAILY_CRON_PATTERN
      } overallStatsCron=${
        env.STATS_SYNCER_OVERALL_CRON_PATTERN
      } dencunForkSlot=${env.DENCUN_FORK_SLOT ?? "auto"}`
    );

    console.log(
      `Blob storage manager configuration: chainId=${env.CHAIN_ID}, file_system=${env.FILE_SYSTEM_STORAGE_ENABLED} postgres=${env.POSTGRES_STORAGE_ENABLED}, gcs=${env.GOOGLE_STORAGE_ENABLED}, swarm=${env.SWARM_STORAGE_ENABLED}`
    );

    if (env.GOOGLE_STORAGE_ENABLED) {
      console.log(
        `GCS configuration: bucketName=${
          env.GOOGLE_STORAGE_BUCKET_NAME
        }, projectId=${maskSensitiveData(
          env.GOOGLE_STORAGE_PROJECT_ID
        )}, apiEndpoint=${env.GOOGLE_STORAGE_API_ENDPOINT}`
      );
    }

    if (env.SWARM_STORAGE_ENABLED) {
      console.log(
        `Swarm configuration: beeEndpoint=${env.BEE_ENDPOINT}, debugEndpoint=${env.BEE_DEBUG_ENDPOINT}`
      );
    }

    if (env.FILE_SYSTEM_STORAGE_ENABLED) {
      console.log(
        `File system configuration: blobDirPath=${env.FILE_SYSTEM_STORAGE_PATH}`
      );
    }
    console.log(
      `Otel configuration: protocol=${
        env.OTEL_EXPORTER_OTLP_PROTOCOL
      } exporterEndpoint=${maskSensitiveData(
        env.OTEL_EXPORTER_OTLP_ENDPOINT
      )} username=${env.OTLP_AUTH_USERNAME} password=${maskSensitiveData(
        env.OTLP_AUTH_PASSWORD
      )} diagEnabled=${env.OTEL_DIAG_ENABLED}`
    );
  },
});

export type Environment = typeof env;
