import dayjs, { normalizeDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import type { PriceFeed } from "@blobscan/price-feed";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";

export interface ETHPriceSyncerConfig extends CommonSyncerConfig {
  ethUsdPriceFeed: PriceFeed;
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

const PRICE_FEED_STATE_ID = 1;

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const now = normalizeDate(dayjs());
        const granularity = determineGranularity(config.cronPattern);

        const [priceFeedState, latestPrice] = await Promise.all([
          prisma.ethUsdPriceFeedState.findFirst({
            where: {
              id: PRICE_FEED_STATE_ID,
            },
          }),
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

        while (
          targetDateTime.isAfter(currentDateTime) ||
          targetDateTime.isSame(currentDateTime)
        ) {
          const priceData = await config.ethUsdPriceFeed.findPriceByTimestamp(
            currentDateTime.unix(),
            {
              startRoundId: latestRoundId,
            }
          );

          if (!priceData) {
            this.logger.warn(
              `Skipping eth price update: No price data found for datetime ${currentDateTime
                .utc()
                .toISOString()}${
                latestRoundId
                  ? ` starting at round with ID "${latestRoundId}"`
                  : ""
              }`
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
                id: PRICE_FEED_STATE_ID,
              },
              update: {
                latestRoundId: roundId,
                updatedAt: new Date(),
              },
              where: {
                id: PRICE_FEED_STATE_ID,
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
