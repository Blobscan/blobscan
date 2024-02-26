import {
  booleanSchema,
  createEnv,
  maskPassword,
  presetEnvOptions,
  z,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      REDIS_URI: z.string().default("redis://localhost:6379"),
      STATS_SYNCER_ENABLED: booleanSchema.default("false"),
      STATS_SYNCER_DAILY_CRON_PATTERN: z.string().default("30 0 * * *"),
      STATS_SYNCER_OVERALL_CRON_PATTERN: z.string().default("*/15 * * * *"),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Stats syncer configuration: enabled=${
        env.STATS_SYNCER_ENABLED
      } redisUri=${maskPassword(env.REDIS_URI)} dailyCronPattern=${
        env.STATS_SYNCER_DAILY_CRON_PATTERN
      } overallCronPattern=${env.STATS_SYNCER_OVERALL_CRON_PATTERN}`
    );
  },
});

export type EnvVars = typeof env;
