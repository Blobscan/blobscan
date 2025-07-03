import dayjs, { normalizeDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import type { PriceFeed } from "@blobscan/price-feed";

import type { CommonCronJobConfig } from "../BaseCronJob";
import { BaseCronJob } from "../BaseCronJob";
import { determineGranularity } from "../utils";

export interface EthPriceCronJobConfig extends CommonCronJobConfig {
  ethUsdPriceFeed: PriceFeed;
}

export class EthPriceCronJob extends BaseCronJob {
  constructor(config: EthPriceCronJobConfig) {
    super({
      ...config,
      name: "eth-price",
      jobFn: async () => {
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

        await prisma.ethUsdPrice.upsert({
          create: priceRow,
          update: priceRow,
          where: {
            timestamp: priceTimestamp,
          },
        });

        this.logger.info(
          `ETH price indexed: $${price} at ${targetDateTime.toISOString()} recorded (retrieved from round ${roundId})`
        );
      },
    });
  }
}
