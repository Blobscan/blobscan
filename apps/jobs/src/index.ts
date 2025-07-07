import { logger } from "@blobscan/logger";

import type { BaseCronJob } from "./cron-jobs/BaseCronJob";
import { DailyStatsCronJob } from "./cron-jobs/daily-stats/DailyStatsCronJob";
import { EthPriceCronJob } from "./cron-jobs/eth-price/EthPriceCronJob";
import { OverallStatsCronJob } from "./cron-jobs/overall-stats/OverallStatsCronJob";
import { SwarmStampCronJob } from "./cron-jobs/swarm-stamp/SwarmStampCronJob";
import { env } from "./env";
import { createRedis } from "./redis";
import { getNetworkDencunForkSlot, gracefulShutdown } from "./utils";

const cronJobs: BaseCronJob[] = [];

async function main() {
  env.display();

  const redis = createRedis(env.REDIS_URI);

  cronJobs.push(
    new DailyStatsCronJob({
      cronPattern: env.STATS_SYNCER_DAILY_CRON_PATTERN,
      redisUriOrConnection: redis,
    }),
    new OverallStatsCronJob({
      cronPattern: env.STATS_SYNCER_OVERALL_CRON_PATTERN,
      redisUriOrConnection: redis,
      forkSlot:
        env.DENCUN_FORK_SLOT ?? getNetworkDencunForkSlot(env.NETWORK_NAME),
    })
  );

  if (env.ETH_PRICE_SYNCER_ENABLED) {
    if (!env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL) {
      logger.warn(
        `Skipping eth price cron job: ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL not defined`
      );
    } else {
      cronJobs.push(
        new EthPriceCronJob({
          cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
          redisUriOrConnection: redis,
        })
      );
    }
  }

  if (env.SWARM_STAMP_SYNCER_ENABLED) {
    if (!env.BEE_ENDPOINT) {
      logger.warn(`Skipping swarm stamp cron job: BEE_ENDPOINT not defined`);
    } else {
      cronJobs.push(
        new SwarmStampCronJob({
          beeEndpoint: env.BEE_ENDPOINT,
          batchId: env.SWARM_BATCH_ID,
          cronPattern: env.SWARM_STAMP_CRON_PATTERN,
          redisUriOrConnection: redis,
        })
      );
    }
  }

  await Promise.all(cronJobs.map((j) => j.start()));
}

async function shutdown() {
  for (const job of cronJobs) {
    try {
      await job.close();
    } catch (err) {
      logger.error(`Error closing job ${job.constructor.name}:`, err);
    }
  }
}

main().catch(async (err) => {
  console.error(err);

  await shutdown();

  process.exit(0);
});

gracefulShutdown(shutdown);
