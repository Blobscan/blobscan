import { prisma } from "@blobscan/db";
import { maskConnectionUrl } from "@blobscan/zod";

import { env } from "../env";
import { gracefulShutdown } from "../utils";
import { SwarmStampCronJob } from "./SwarmStampCronJob";

let swarmStampCronJob: SwarmStampCronJob | undefined;

async function main() {
  if (!env.SWARM_STAMP_SYNCER_ENABLED) {
    return;
  }

  if (!env.BEE_ENDPOINT) {
    throw new Error(`Failed to start Swarm Stamp Worker: BEE_ENDPOINT unset`);
  }

  let batchId = env.SWARM_BATCH_ID;

  if (!batchId) {
    const blobStorageState = await prisma.blobStoragesState.findUnique({
      where: { id: 1 },
    });

    if (!blobStorageState?.swarmDataId) {
      throw new Error(
        "Failed to start Swarm Stamp Worker: couldn't find batch id"
      );
    }

    batchId = blobStorageState.swarmDataId;
  }

  console.log(
    `ETH Price Cron Job Worker
      granularity=${env.ETH_PRICE_SYNCER_CRON_PATTERN},
      redisUri=${maskConnectionUrl(env.REDIS_URI)}
      databaseUrl=${maskConnectionUrl(env.DATABASE_URL)},
      beeEndpoint=${
        env.BEE_ENDPOINT ? maskConnectionUrl(env.BEE_ENDPOINT) : undefined
      },
      batchId=${batchId},
    `
  );

  swarmStampCronJob = new SwarmStampCronJob({
    cronPattern: env.SWARM_STAMP_CRON_PATTERN,
    batchId,
    beeEndpoint: env.BEE_ENDPOINT,
    redisUriOrConnection: env.REDIS_URI,
  });
}

main().catch(async (err) => {
  console.error(err);

  await swarmStampCronJob?.close();

  process.exit(1);
});

gracefulShutdown(async () => {
  await swarmStampCronJob?.close();
});
