import type { Address } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";

import dayjs, { normalizeDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { PriceFeed } from "@blobscan/price-feed";

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

type Granularity = "minute" | "hour" | "day";

function determineGranularity(cronPattern: string): Granularity {
  switch (cronPattern) {
    case "0 * * * *":
      return "hour";
    case "0 0 * * *":
      return "day";
    case "* * * * *":
      return "minute";
    default:
      throw new Error(`Unsupported cron pattern: ${cronPattern}`);
  }
}

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const now = normalizeDate(dayjs());
        const granularity = determineGranularity(config.cronPattern);

        const ethUsdPriceFeed = await createOrGetEthUsdPriceFeed(config);
        const [priceFeedState, latestPrice] = await Promise.all([
          prisma.ethUsdPriceFeedState.findFirst(),
          prisma.ethUsdPrice.findFirst({
            orderBy: {
              timestamp: "desc",
            },
          }),
        ]);

        const targetDateTime = now.startOf(granularity);
        let currentDateTime = latestPrice?.timestamp
          ? normalizeDate(latestPrice.timestamp)
              .add(1, granularity)
              .startOf(granularity)
          : targetDateTime;
        let latestRoundId = priceFeedState?.latestRoundId.toFixed();

        while (targetDateTime >= currentDateTime) {
          const priceData = await ethUsdPriceFeed.findPriceByTimestamp(
            currentDateTime.unix(),
            {
              startRoundId: latestRoundId,
            }
          );

          if (!priceData) {
            console.log(
              `Skipping eth price update: No price data found for datetime ${targetDateTime
                .utc()
                .toISOString()}`
            );

            return;
          }

          const roundId = priceData.roundId.toString();
          const price = priceData.price;

          const priceUpdatePromise = prisma.ethUsdPrice.create({
            data: {
              price,
              timestamp: currentDateTime.toDate(),
            },
          });

          const priceFeedStateUpdatePromise =
            prisma.ethUsdPriceFeedState.upsert({
              create: {
                latestRoundId: roundId,
              },
              update: {
                latestRoundId: roundId,
              },
              where: {
                id: 1,
              },
            });

          await prisma.$transaction([
            priceUpdatePromise,
            priceFeedStateUpdatePromise,
          ]);

          this.logger.info(
            `ETH price synced: $${price} at ${currentDateTime.toISOString()} recorded (retrieved from round ${roundId})`
          );

          currentDateTime = currentDateTime.add(1, granularity);
          latestRoundId = roundId;
        }
      },
    });
  }
}
