import type { PublicClient } from "viem";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";

import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { PriceFeed } from "@blobscan/price-feed";
import type { BaseSyncer } from "@blobscan/syncers";
import {
  DailyStatsSyncer,
  ETHPriceSyncer,
  OverallStatsSyncer,
  SwarmStampSyncer,
  createRedisConnection,
} from "@blobscan/syncers";

import { logger } from "./logger";
import { getNetworkDencunForkSlot } from "./utils";

export async function setUpSyncers() {
  const connection = createRedisConnection(env.REDIS_URI);
  const syncers: BaseSyncer[] = [];

  // SwarmStampSyncer is added if there is already an element with id 1
  // This is useful in case Swarm storage is temporarily disabled, so that
  // the Swarm TTL is still updated.
  const blobStoragesState = await prisma.blobStoragesState.findUnique({
    where: { id: 1 },
  });
  if (blobStoragesState) {
    logger.info("SwarmStampSyncer added");
    syncers.push(
      new SwarmStampSyncer({
        cronPattern: env.SWARM_STAMP_CRON_PATTERN,
        redisUriOrConnection: connection,
        batchId: env.SWARM_BATCH_ID || blobStoragesState.swarmDataId,
        beeEndpoint: env.BEE_ENDPOINT || "http://localhost:1633",
      })
    );
  }

  syncers.push(
    new DailyStatsSyncer({
      cronPattern: env.STATS_SYNCER_DAILY_CRON_PATTERN,
      redisUriOrConnection: connection,
    })
  );

  syncers.push(
    new OverallStatsSyncer({
      cronPattern: env.STATS_SYNCER_OVERALL_CRON_PATTERN,
      redisUriOrConnection: connection,
      lowestSlot:
        env.DENCUN_FORK_SLOT ?? getNetworkDencunForkSlot(env.NETWORK_NAME),
    })
  );

  if (env.ETH_PRICE_SYNCER_ENABLED && env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL) {
    const chain = Object.values(chains).find(
      (c) => c.id === env.ETH_PRICE_SYNCER_CHAIN_ID
    );

    if (!chain) {
      throw new Error(
        `Can't initialize ETH price syncer: chain with id ${env.ETH_PRICE_SYNCER_CHAIN_ID} not found`
      );
    }

    const client = createPublicClient({
      chain,
      transport: http(env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL),
    });

    const ethUsdPriceFeed = await PriceFeed.create({
      client: client as PublicClient,
      dataFeedContractAddress:
        env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS as `0x${string}`,
      timeTolerance: env.ETH_PRICE_SYNCER_TIME_TOLERANCE,
    });

    syncers.push(
      new ETHPriceSyncer({
        cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
        redisUriOrConnection: connection,
        ethUsdPriceFeed,
      })
    );
  }

  await Promise.all(syncers.map((syncer) => syncer.start()));

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
