import { booleanSchema, createEnv, presetEnvOptions, z } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      DATABASE_URL: z.string().url(),
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
    },
    ...presetEnvOptions,
  },
});
