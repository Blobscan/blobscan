import type { RefinementCtx } from "@blobscan/zod";
import {
  z,
  blobStorageSchema,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
  maskPassword,
  networkSchema,
  maskSensitiveData,
  prismaBatchOperationsMaxSizeSchema,
} from "@blobscan/zod";

function requireIfEnvEnabled(envName: string) {
  return (value: unknown, ctx: RefinementCtx) => {
    if (process.env[envName] === "true" && value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `This field is required when ${envName} is set to "true"`,
      });
    }
  };
}

export const env = createEnv({
  envOptions: {
    server: {
      // General
      BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
      NODE_ENV: nodeEnvSchema.optional(),
      SECRET_KEY: z.string(),
      CHAIN_ID: z.coerce.number().positive().default(1),
      DENCUN_FORK_SLOT: z.coerce.number().optional(),
      NETWORK_NAME: networkSchema.default("mainnet"),
      TEST: booleanSchema.optional(),
      BLOBSCAN_API_BASE_URL: z
        .string()
        .url()
        .default(`http://localhost:${process.env.BLOBSCAN_API_PORT ?? 3001}`),

      // Logging
      LOG_LEVEL: z
        .enum(["debug", "http", "info", "warn", "error"])
        .default("http"),
      METRICS_ENABLED: booleanSchema.default("false"),
      TRACES_ENABLED: booleanSchema.default("false"),

      // Prisma
      PRISMA_BATCH_OPERATIONS_MAX_SIZE: prismaBatchOperationsMaxSizeSchema,

      // Redis
      REDIS_URI: z.string().default("redis://localhost:6379"),

      // Sentry
      SENTRY_DSN_API: z.string().optional(),

      // Stats syncer
      STATS_SYNCER_DAILY_CRON_PATTERN: z.string().default("30 0 * * * *"),
      STATS_SYNCER_OVERALL_CRON_PATTERN: z.string().default("*/15 * * * *"),

      // Blob Propagator
      BLOB_PROPAGATOR_COMPLETED_JOBS_AGE: z.coerce
        .number()
        .default(24 * 60 * 60),
      BLOB_PROPAGATOR_FAILED_JOBS_AGE: z.coerce
        .number()
        .default(7 * 24 * 60 * 60),

      // PostHog
      POSTHOG_ID: z.string().optional(),
      POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),

      // OpenTelemetry
      OTEL_DIAG_ENABLED: z.boolean().default(false),
      OTLP_AUTH_USERNAME: z.coerce.string().optional(),
      OTLP_AUTH_PASSWORD: z.string().optional(),
      OTEL_EXPORTER_OTLP_PROTOCOL: z
        .enum(["grpc", "http/protobuf", "http/json"])
        .default("http/protobuf"),
      OTEL_EXPORTER_OTLP_ENDPOINT: z
        .string()
        .url()
        .default("http://localhost:4318"),

      /*
       * ====================
       *  ETH/USD Price Feed
       * ====================
       *
       * https://polygonscan.com/address/0xF9680D99D6C9589e2a93a78A04A279e509205945
       * https://data.chain.link/
       */

      // ETH Price is retrieved every second from the Chainlink: ETH/USD oracle
      // in the Polygon network.
      ETH_PRICE_SYNCER_ENABLED: booleanSchema.default("false"),
      ETH_PRICE_SYNCER_CRON_PATTERN: z.default("* * * * *"),
      ETH_PRICE_SYNCER_CHAIN_ID: z.coerce.number().default(137),
      ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL: z.string().url().optional(),
      ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS: z
        .string()
        .default("0xF9680D99D6C9589e2a93a78A04A279e509205945"),
      ETH_PRICE_SYNCER_TIME_TOLERANCE: z.coerce
        .number()
        .positive()
        .default(60),

      /*
       * =====================
       *   STORAGE PROVIDERS
       * =====================
       */

      // General storage settings
      BLOB_PROPAGATOR_TMP_BLOB_STORAGE:
        blobStorageSchema.default("FILE_SYSTEM"),

      // File system storage
      FILE_SYSTEM_STORAGE_ENABLED: booleanSchema.default("false"),
      FILE_SYSTEM_STORAGE_PATH: z.string().default("/tmp/blobscan-blobs"),

      // Postgres blob storage
      POSTGRES_STORAGE_ENABLED: booleanSchema.default("false"),

      // Google Cloud Storage
      GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
      GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
      GOOGLE_STORAGE_API_ENDPOINT: z.string().optional(),
      GOOGLE_STORAGE_BUCKET_NAME: z
        .string()
        .optional()
        .superRefine(requireIfEnvEnabled("GOOGLE_STORAGE_ENABLED")),
      GOOGLE_SERVICE_KEY: z
        .string()
        .optional()
        .superRefine(requireIfEnvEnabled("GOOGLE_STORAGE_ENABLED")),

      // Swarm storage
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
      SWARM_DEFERRED_UPLOAD: booleanSchema.default("true"),
      SWARM_STAMP_CRON_PATTERN: z.string().default("*/15 * * * *"),
      SWARM_BATCH_ID: z.string().optional(),
      BEE_ENDPOINT: z
        .string()
        .url()
        .optional()
        .superRefine(requireIfEnvEnabled("SWARM_STORAGE_ENABLED")),

      // WeaveVM storage
      WEAVEVM_STORAGE_ENABLED: booleanSchema.default("false"),
      WEAVEVM_STORAGE_API_BASE_URL: z
        .string()
        .url()
        .default("https://blobscan.wvm.network")
        .superRefine(requireIfEnvEnabled("WEAVEVM_STORAGE_ENABLED")),
      WEAVEVM_API_KEY: z
        .string()
        .optional()
        .superRefine(requireIfEnvEnabled("WEAVEVM_STORAGE_ENABLED")),

      VITEST_MAINNET_FORK_URL: z
        .string()
        .url()
        .optional()
        .default("https://eth.llamarpc.com"),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `API configuration: secretKey: ${maskSensitiveData(
        env.SECRET_KEY
      )} redisUri=${maskPassword(env.REDIS_URI)} temporalBlobStorage=${
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
      console.log(`Swarm configuration: beeEndpoint=${env.BEE_ENDPOINT}`);
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
