import type { PublicClient } from "viem";
import { createPublicClient, http } from "viem";

import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";
import { ETH_USD_PRICE_FEEDS } from "@blobscan/price-feed";
import type { BaseSyncer } from "@blobscan/syncers";
import {
  ETHPriceSyncer,
  createRedisConnection,
  resolveEthPriceRpcUrls,
} from "@blobscan/syncers";

import { prisma } from "../clients/prisma";

/**
 * Short limits for the price feed RPC calls. When an RPC does not respond,
 * the syncer must go to the next feed quickly, so that the tick ends before
 * the next minute.
 */
const PRICE_FEED_RPC_TIMEOUT_MS = 5_000;
const PRICE_FEED_RPC_RETRY_COUNT = 1;

export async function setUpSyncers() {
  const connection = createRedisConnection(env.REDIS_URI);
  const syncers: BaseSyncer[] = [];

  if (env.ETH_PRICE_SYNCER_ENABLED) {
    const { rpcUrls, warnings } = resolveEthPriceRpcUrls({
      rpcUrls: env.ETH_PRICE_SYNCER_RPC_URLS,
      legacyChainId: env.ETH_PRICE_SYNCER_CHAIN_ID,
      legacyRpcUrl: env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL,
    });

    warnings.forEach((warning) => logger.warn(warning));

    const priceFeedSources = ETH_USD_PRICE_FEEDS.flatMap((definition) => {
      const rpcUrl = rpcUrls[definition.chain.id];

      if (!rpcUrl) {
        return [];
      }

      const client = createPublicClient({
        chain: definition.chain,
        transport: http(rpcUrl, {
          timeout: PRICE_FEED_RPC_TIMEOUT_MS,
          retryCount: PRICE_FEED_RPC_RETRY_COUNT,
        }),
      }) as PublicClient;

      return [{ definition, client }];
    });

    if (!priceFeedSources.length) {
      logger.warn(
        "ETH price syncer is enabled but it does not run: set ETH_PRICE_SYNCER_RPC_URLS (for example 137=https://polygon-rpc.example)"
      );
    } else {
      logger.info(
        `ETH price syncer feeds, in order: ${priceFeedSources
          .map(({ definition }) => `${definition.chain.name} (${definition.chain.id})`)
          .join(", ")}`
      );

      syncers.push(
        new ETHPriceSyncer({
          cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
          prisma,
          redisUriOrConnection: connection,
          priceFeedSources,
          timeTolerance: env.ETH_PRICE_SYNCER_TIME_TOLERANCE,
        })
      );
    }
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
