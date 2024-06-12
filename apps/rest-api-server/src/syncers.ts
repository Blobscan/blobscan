/* eslint-disable @typescript-eslint/no-misused-promises */

import {
  DailyStatsSyncer,
  OverallStatsSyncer,
  createRedisConnection,
} from "@blobscan/syncers";

import { env } from "./env";
import { getNetworkDencunForkSlot } from "./utils";

export function setUpSyncers() {
  const connection = createRedisConnection(env.REDIS_URI);

  const dailyStatsSyncer = new DailyStatsSyncer({
    cronPattern: env.STATS_SYNCER_DAILY_CRON_PATTERN,
    redisUriOrConnection: connection,
  });

  const overallStatsSyncer = new OverallStatsSyncer({
    cronPattern: env.STATS_SYNCER_OVERALL_CRON_PATTERN,
    redisUriOrConnection: connection,
    lowestSlot:
      env.DENCUN_FORK_SLOT ?? getNetworkDencunForkSlot(env.NETWORK_NAME),
  });

  Promise.all([dailyStatsSyncer.start(), overallStatsSyncer.start()]);

  return () => {
    return dailyStatsSyncer.close().finally(() => overallStatsSyncer.close());
  };
}
