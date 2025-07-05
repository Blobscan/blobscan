import type { PublicClient } from "viem";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";

import { PriceFeed } from "@blobscan/price-feed";
import { maskConnectionUrl, maskJSONRPCUrl } from "@blobscan/zod";

import { env } from "../env";
import { determineGranularity, gracefulShutdown } from "../utils";
import { EthPriceCronJob } from "./EthPriceCronJob";

let ethPriceCronJob: EthPriceCronJob | undefined;

async function main() {
  if (!env.ETH_PRICE_SYNCER_ENABLED) {
    return;
  }

  console.log(
    `ETH Price Cron Job Worker
      granularity=${determineGranularity(env.ETH_PRICE_SYNCER_CRON_PATTERN)},
      redisUri=${maskConnectionUrl(env.REDIS_URI)},
      databaseUrl=${maskConnectionUrl(env.DATABASE_URL)},
      chainId=${env.ETH_PRICE_SYNCER_CHAIN_ID},
      jsonRpcUrl=${maskJSONRPCUrl(env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL)},
      priceFeedContract=${
        env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS
      },
      timeTolerance=${env.ETH_PRICE_SYNCER_TIME_TOLERANCE}`
  );

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

  ethPriceCronJob = new EthPriceCronJob({
    redisUriOrConnection: env.REDIS_URI,
    cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
    ethUsdPriceFeed,
  });

  await ethPriceCronJob.start();
}

main().catch(async (err) => {
  console.error(err);

  await ethPriceCronJob?.close();

  process.exit(1);
});

gracefulShutdown(async () => {
  await ethPriceCronJob?.close();
});
