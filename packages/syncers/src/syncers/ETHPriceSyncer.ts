import dayjs, { normalizeDate } from "@blobscan/dayjs";
import type { BlobscanPrismaClient } from "@blobscan/db";
import type { PriceFeed } from "@blobscan/price-feed";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";

export interface ETHPriceSyncerConfig extends CommonSyncerConfig {
  prisma: BlobscanPrismaClient;
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

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const now = normalizeDate(dayjs());
        const granularity = determineGranularity(config.cronPattern);

        const targetDateTime = now.startOf(granularity);

        const priceData = await config.ethUsdPriceFeed.findPriceByTimestamp(
          targetDateTime.unix()
        );

        if (!priceData) {
          this.logger.warn(
            `Skipping eth price update: No price data found for datetime ${targetDateTime
              .utc()
              .toISOString()}`
          );

          return;
        }

        const roundId = priceData.roundId.toString();
        const price = priceData.price;
        const priceTimestamp = targetDateTime.toDate();
        const priceRow = {
          price,
          timestamp: priceTimestamp,
        };

        await config.prisma.ethUsdPrice.upsert({
          create: priceRow,
          update: priceRow,
          where: {
            timestamp: priceTimestamp,
          },
        });

        this.logger.debug(
          `ETH price synced: $${price} at ${targetDateTime.toISOString()} recorded (retrieved from round ${roundId})`
        );
      },
    });
  }
}
