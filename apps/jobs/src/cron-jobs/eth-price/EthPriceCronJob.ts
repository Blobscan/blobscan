import type { PriceFeed } from "@blobscan/price-feed";

import type { CommonCronJobConfig } from "../BaseCronJob";
import { BaseCronJob } from "../BaseCronJob";
import ethPrice from "./processor";

export interface EthPriceCronJobConfig extends CommonCronJobConfig {
  ethUsdPriceFeed: PriceFeed;
}

export class EthPriceCronJob extends BaseCronJob {
  constructor({ ...restConfig }: CommonCronJobConfig) {
    super({
      ...restConfig,
      name: "eth-price",
      processor: ethPrice,
    });

    this.worker?.on("completed", (_, result?) => {
      const { price, timestamp, roundId } = result as {
        price?: number;
        timestamp: string;
        roundId?: string;
      };

      if (!price && !roundId) {
        this.logger.warn(
          `Skipping eth price update: No price data found for datetime ${timestamp}`
        );

        return;
      }

      this.logger.info(
        `ETH price indexed: $${price} at ${timestamp} recorded (retrieved from round ${roundId})`
      );
    });
  }
}
