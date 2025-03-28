import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";

import { prisma } from "@blobscan/db";
import { PriceFeed } from "@blobscan/eth-price";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";

export interface ETHPriceSyncerConfig extends CommonSyncerConfig {
  chainId: number;
  chainJsonRpcUrl: string;
  ethUsdDataFeedContractAddress: string;
}

let ethUsdPriceFeed: PriceFeed | undefined;

function getViemChain(chainId: number) {
  switch (chainId) {
    case 1:
      return mainnet;
    case 137:
      return polygon;

    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

async function createOrGetEthUsdPriceFeed({
  chainId,
  chainJsonRpcUrl,
  ethUsdDataFeedContractAddress,
}: ETHPriceSyncerConfig) {
  if (!ethUsdPriceFeed) {
    const chain = getViemChain(chainId);
    const client = createPublicClient({
      chain,
      transport: http(chainJsonRpcUrl),
    });

    ethUsdPriceFeed = await PriceFeed.create({
      client,
      dataFeedContractAddress: ethUsdDataFeedContractAddress as Address,
    });
  }

  return ethUsdPriceFeed;
}

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const ethUsdPriceFeed = await createOrGetEthUsdPriceFeed(config);
        const now = new Date();
        const priceData = await ethUsdPriceFeed.findPriceByTimestamp(now);

        if (!priceData) {
          console.log(
            `No price data found for time date ${
              now.getTime() / 1000
            }. Skipping…`
          );

          return;
        }

        const { price, timestamp } = priceData;

        // The timestamp is a bigint in seconds.
        // Prisma expects a Date object.

        await prisma.ethUsdPrice.create({
          data: {
            price: price.toString(),
            timestamp,
          },
        });

        this.logger.info(`Fetched price data: ${JSON.stringify(priceData)}`);
      },
    });
  }
}
