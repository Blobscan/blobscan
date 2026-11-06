import type { PublicClient } from "viem";
import { createPublicClient, http } from "viem";

import { env } from "@blobscan/env";
import { ETH_USD_PRICE_FEEDS, findEthUsdPriceFeed } from "@blobscan/price-feed";
import type { BaseSyncer } from "@blobscan/syncers";
import { ETHPriceSyncer, createRedisConnection } from "@blobscan/syncers";

import { prisma } from "../clients/prisma";

const LEGACY_ETH_PRICE_SYNCER_CHAIN_ID = 137;

/**
 * Returns the RPC URL of each chain. ETH_PRICE_SYNCER_RPC_URLS wins over the
 * deprecated ETH_PRICE_SYNCER_CHAIN_ID and ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL.
 */
export function getEthPriceSyncerRpcUrls(
  ethPriceEnv: Pick<
    typeof env,
    | "ETH_PRICE_SYNCER_RPC_URLS"
    | "ETH_PRICE_SYNCER_CHAIN_ID"
    | "ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL"
  >
): Record<number, string> {
  const rpcUrls: Record<number, string> = {};

  if (ethPriceEnv.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL) {
    const legacyChainId =
      ethPriceEnv.ETH_PRICE_SYNCER_CHAIN_ID ?? LEGACY_ETH_PRICE_SYNCER_CHAIN_ID;

    rpcUrls[legacyChainId] = ethPriceEnv.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL;
  }

  return { ...rpcUrls, ...ethPriceEnv.ETH_PRICE_SYNCER_RPC_URLS };
}

export async function setUpSyncers() {
  const connection = createRedisConnection(env.REDIS_URI);
  const syncers: BaseSyncer[] = [];

  const ethPriceRpcUrls = getEthPriceSyncerRpcUrls(env);

  if (env.ETH_PRICE_SYNCER_ENABLED && Object.keys(ethPriceRpcUrls).length) {
    const unknownChainIds = Object.keys(ethPriceRpcUrls)
      .map(Number)
      .filter((chainId) => !findEthUsdPriceFeed(chainId));

    if (unknownChainIds.length) {
      throw new Error(
        `Can't initialize ETH price syncer: no ETH/USD price feed for chain(s) ${unknownChainIds.join(
          ", "
        )}. Supported chains: ${ETH_USD_PRICE_FEEDS.map(
          ({ chain }) => chain.id
        ).join(", ")}`
      );
    }

    const priceFeedSources = ETH_USD_PRICE_FEEDS.flatMap((definition) => {
      const rpcUrl = ethPriceRpcUrls[definition.chain.id];

      if (!rpcUrl) {
        return [];
      }

      const client = createPublicClient({
        chain: definition.chain,
        transport: http(rpcUrl),
      }) as PublicClient;

      return [{ definition, client }];
    });

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
