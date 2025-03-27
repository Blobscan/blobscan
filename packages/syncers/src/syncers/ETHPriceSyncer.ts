import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";

import dayjs from "@blobscan/dayjs";
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
        const now = Math.floor(Date.now() / 1_000);
        const priceData = await ethUsdPriceFinder.getPriceByTimestamp(now);

        if (!priceData) {
          console.log(
            `No price data found for time date ${dayjs
              .unix(now)
              .utc()}. Skipping…`
          );

          return;
        }

        // The timestamp is a bigint in seconds.
        // Prisma expects a Date object.
        const timestamp = new Date(Number(priceData.updatedAt) * 1_000);

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
