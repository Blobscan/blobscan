import { env } from "@blobscan/env";
import { BaseSyncer } from "@blobscan/syncers";
import { createRedisConnection } from "@blobscan/syncers";
import {
  syncSwarmStamp,
  aggregateDailyStats,
  aggregateOverallStats,
} from "@blobscan/syncers/src/";

import { logger } from "./logger";
import { getNetworkDencunForkSlot } from "./utils";

export function setUpSyncers() {
  const connection = createRedisConnection(env.REDIS_URI);
  const syncers: BaseSyncer[] = [];

  if (env.SWARM_STORAGE_ENABLED) {
    const { SWARM_BATCH_ID, BEE_ENDPOINT } = env;

    if (SWARM_BATCH_ID === undefined) {
      logger.error(`Can't initialize Swarm stamp job: no batch ID provided`);
    }

    if (BEE_ENDPOINT === undefined) {
      logger.error(
        "Can't initialize Swarm stamp job: no Bee endpoint provided"
      );
    }

    if (SWARM_BATCH_ID !== undefined && BEE_ENDPOINT !== undefined) {
      const swarmStampSyncer = new BaseSyncer({
        name: "swarm-stamp",
        connection,
        cronPattern: env.SWARM_STAMP_CRON_PATTERN,
        syncerFn: () =>
          syncSwarmStamp({
            beeEndpoint: BEE_ENDPOINT,
            batchId: SWARM_BATCH_ID,
          }),
      });

      syncers.push(swarmStampSyncer);
    }
  }

  syncers.push(
    new BaseSyncer({
      name: "daily-stats",
      connection,
      cronPattern: env.STATS_SYNCER_DAILY_CRON_PATTERN,
      syncerFn: aggregateDailyStats,
    })
  );

  syncers.push(
    new BaseSyncer({
      name: "overall-stats",
      connection,
      cronPattern: env.STATS_SYNCER_OVERALL_CRON_PATTERN,
      syncerFn: () =>
        aggregateOverallStats({
          lowestSlot:
            env.DENCUN_FORK_SLOT ?? getNetworkDencunForkSlot(env.NETWORK_NAME),
        }),
    })
  );

  Promise.all(syncers.map((syncer) => syncer.start()));

  return () => {
    let teardownPromise = Promise.resolve();

    for (const syncer of syncers) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      teardownPromise = teardownPromise.finally(async () => {
        await syncer.close();
      });
    }

    return teardownPromise;
  };
}
