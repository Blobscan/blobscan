import { booleanSchema, createEnv, presetEnvOptions, z } from "@blobscan/zod";

const networkSchema = z.enum([
  "mainnet",
  "holesky",
  "hoodi",
  "sepolia",
  "gnosis",
  "chiado",
  "devnet",
]);

export const env = createEnv({
  envOptions: {
    server: {
      DATABASE_URL: z.string().url(),
      DENCUN_FORK_SLOT: z.coerce.number().optional(),
      NETWORK_NAME: networkSchema.default("mainnet"),

      // Stats jobs
      STATS_SYNCER_DAILY_CRON_PATTERN: z.string().default("30 0 * * * *"),
      STATS_SYNCER_OVERALL_CRON_PATTERN: z.string().default("*/15 * * * *"),

      // ETH Price is retrieved every second from the Chainlink: ETH/USD oracle
      // in the Polygon network.
      ETH_PRICE_SYNCER_ENABLED: booleanSchema.default("false"),
      ETH_PRICE_SYNCER_CRON_PATTERN: z.string().default("* * * * *"),
      ETH_PRICE_SYNCER_CHAIN_ID: z.coerce.number().default(137),
      ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL: z.string().url().optional(),
      ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS: z
        .string()
        .default("0xF9680D99D6C9589e2a93a78A04A279e509205945"),
      ETH_PRICE_SYNCER_TIME_TOLERANCE: z.coerce.number().positive().optional(),

      REDIS_URI: z.string().default("redis://localhost:6379"),

      SWARM_STAMP_SYNCER_ENABLED: booleanSchema.default("false"),
      SWARM_STAMP_CRON_PATTERN: z.string().default("*/15 * * * *"),
      SWARM_BATCH_ID: z.string().optional(),
      BEE_ENDPOINT: z.string().url().optional(),
    },
    ...presetEnvOptions,
  },
});
