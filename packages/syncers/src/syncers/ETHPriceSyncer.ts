import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";

import { prisma } from "@blobscan/db";
import { PriceFeedFinder } from "@blobscan/eth-price";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";

export interface ETHPriceSyncerConfig extends CommonSyncerConfig {
  chainId: number;
  chainJsonRpcUrl: string;
  ethUsdDataFeedContractAddress: string;
}

let ethUsdPriceFinder: PriceFeedFinder | undefined;

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

async function getEthUsdPriceFinder({
  chainId,
  chainJsonRpcUrl,
  ethUsdDataFeedContractAddress,
}: ETHPriceSyncerConfig) {
  if (!ethUsdPriceFinder) {
    const chain = getViemChain(chainId);
    const client = createPublicClient({
      chain,
      transport: http(chainJsonRpcUrl),
    });

    ethUsdPriceFinder = await PriceFeedFinder.create({
      client,
      dataFeedContractAddress: ethUsdDataFeedContractAddress as Address,
    });
  }

  return ethUsdPriceFinder;
}

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const ethUsdPriceFinder = await getEthUsdPriceFinder(config);
        const now = new Date();
        const priceData = await ethUsdPriceFinder.findPriceByTimestamp(now);

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
