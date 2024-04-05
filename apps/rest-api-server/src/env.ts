import {
  z,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
  maskPassword,
  networkSchema,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      BLOBSCAN_API_BASE_URL: z
        .string()
        .url()
        .default("https://api.blobscan.com"),
      BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
      NETWORK_NAME: networkSchema.default("mainnet"),
      NODE_ENV: nodeEnvSchema.optional(),
      TRACES_ENABLED: booleanSchema.default("false"),
      METRICS_ENABLED: booleanSchema.default("false"),
      REDIS_URI: z.string().default("redis://localhost:6379"),
      DENCUN_FORK_SLOT: z.coerce.number().optional(),
      STATS_SYNCER_DAILY_CRON_PATTERN: z.string().default("30 0 * * * *"),
      STATS_SYNCER_OVERALL_CRON_PATTERN: z.string().default("*/15 * * * *"),
      SENTRY_DSN_API: z.string().url().optional(),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Configuration: network=${
        env.NETWORK_NAME
      } sentryEnabled=${!!env.SENTRY_DSN_API} metrics=${
        env.METRICS_ENABLED
      } traces=${env.TRACES_ENABLED} port=${
        env.BLOBSCAN_API_PORT
      } redisUri=${maskPassword(env.REDIS_URI)} dailyStatsCron=${
        env.STATS_SYNCER_DAILY_CRON_PATTERN
      } overallStatsCron=${
        env.STATS_SYNCER_OVERALL_CRON_PATTERN
      } dencunForkSlot=${env.DENCUN_FORK_SLOT ?? "auto"}`
    );
  },
});

export type Environment = typeof env;
