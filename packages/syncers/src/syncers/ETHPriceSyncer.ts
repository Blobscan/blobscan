import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { prisma } from "@blobscan/db";
import { PriceFeedFinder } from "@blobscan/eth-price";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";

const ONE_HOUR_SECONDS = BigInt(60 * 60);

export interface ETHPriceSyncerConfig extends CommonSyncerConfig {
  chainJsonRpcUrl: string;
  ethUsdDataFeedContractAddress: string;
}

let ethUsdPriceFinder: PriceFeedFinder | undefined;

function getEthUsdPriceFinder(
  chainJsonRpcUrl: string,
  ethUsdDataFeedContractAddress: string
) {
  if (!ethUsdPriceFinder) {
    ethUsdPriceFinder = new PriceFeedFinder(
      createPublicClient({
        chain: {
          ...mainnet,
          rpcUrls: {
            default: {
              http: [chainJsonRpcUrl],
            },
          },
        },
        transport: http(),
      }),
      ethUsdDataFeedContractAddress as Address,
      ONE_HOUR_SECONDS
    );
  }

  return ethUsdPriceFinder;
}

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const ethUsdPriceFinder = getEthUsdPriceFinder(
          config.chainJsonRpcUrl,
          config.ethUsdDataFeedContractAddress
        );
        const priceData = await ethUsdPriceFinder.getPriceByTimestamp(
          BigInt(Math.floor(Date.now() / 1_000))
        );

        // The timestamp is a bigint in seconds.
        // Prisma expects a Date object.
        const timestamp = new Date(Number(priceData.timestampSeconds) * 1_000);

        await prisma.ethUsdPrice.create({
          data: {
            price: priceData.price.toString(),
            timestamp,
          },
        });

        this.logger.info(`Fetched price data: ${JSON.stringify(priceData)}`);
      },
    });
  }
}
