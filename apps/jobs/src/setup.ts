import type { PublicClient } from "viem";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";

import type { BlobscanPrismaClient } from "@blobscan/db";
import { env } from "@blobscan/env";
import { PriceFeed } from "@blobscan/price-feed";

import type { BaseJob } from "./jobs";
import { EthPriceJob } from "./jobs";

async function createEthPriceJob(prisma: BlobscanPrismaClient) {
  if (!env.ETH_PRICE_JOB_CHAIN_JSON_RPC_URL) {
    throw new Error(
      "Can't create the ETH price job: ETH_PRICE_JOB_CHAIN_JSON_RPC_URL is not set"
    );
  }

  const chain = Object.values(chains).find(
    (c) => c.id === env.ETH_PRICE_JOB_CHAIN_ID
  );

  if (!chain) {
    throw new Error(
      `Can't create the ETH price job: chain with id ${env.ETH_PRICE_JOB_CHAIN_ID} not found`
    );
  }

  const client = createPublicClient({
    chain,
    transport: http(env.ETH_PRICE_JOB_CHAIN_JSON_RPC_URL),
  });

  const ethUsdPriceFeed = await PriceFeed.create({
    client: client as PublicClient,
    dataFeedContractAddress:
      env.ETH_PRICE_JOB_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS as `0x${string}`,
    timeTolerance: env.ETH_PRICE_JOB_TIME_TOLERANCE,
  });

  return new EthPriceJob({
    cronPattern: env.ETH_PRICE_JOB_CRON_PATTERN,
    prisma,
    ethUsdPriceFeed,
  });
}

/**
 * Creates the enabled jobs. Throws an error when an enabled job does not have
 * its required configuration.
 */
export async function createJobs(
  prisma: BlobscanPrismaClient
): Promise<BaseJob[]> {
  const jobs: BaseJob[] = [];

  if (env.ETH_PRICE_JOB_ENABLED) {
    jobs.push(await createEthPriceJob(prisma));
  }

  return jobs;
}
