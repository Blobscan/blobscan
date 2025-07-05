import { maskConnectionUrl } from "@blobscan/zod";

import { env } from "../env";
import { createRedis } from "../redis";
import { getNetworkDencunForkSlot, gracefulShutdown } from "../utils";
import { DailyStatsCronJob } from "./DailyStatsCronJob";
import { OverallStatsCronJob } from "./OverallStatsCronJob";

let dailyStatsCronJob: DailyStatsCronJob | undefined;
let overallStatsCronJob: OverallStatsCronJob | undefined;

async function main() {
  const redis = createRedis(env.REDIS_URI);

  console.log(
    `Stats Cron Job Worker
      granularityOverall=${env.STATS_SYNCER_OVERALL_CRON_PATTERN},
      redisUri=${maskConnectionUrl(env.REDIS_URI)},
      databaseUrl=${maskConnectionUrl(env.DATABASE_URL)}`
  );
  dailyStatsCronJob = new DailyStatsCronJob({
    cronPattern: env.STATS_SYNCER_DAILY_CRON_PATTERN,
    redisUriOrConnection: redis,
  });

  overallStatsCronJob = new OverallStatsCronJob({
    cronPattern: env.STATS_SYNCER_OVERALL_CRON_PATTERN,
    redisUriOrConnection: redis,
    lowestSlot:
      env.DENCUN_FORK_SLOT ?? getNetworkDencunForkSlot(env.NETWORK_NAME),
  });

  await dailyStatsCronJob.start();
  await overallStatsCronJob.start();
}

main().catch(async (err) => {
  console.error(err);

  try {
    await dailyStatsCronJob?.close();
  } finally {
    await overallStatsCronJob?.close();
  }
});

gracefulShutdown(async () => {
  try {
    await dailyStatsCronJob?.close();
  } finally {
    await overallStatsCronJob?.close();
  }
});
