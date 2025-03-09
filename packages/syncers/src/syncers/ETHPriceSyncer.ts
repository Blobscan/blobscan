import { prisma } from "@blobscan/db";
import { getPriceByTimestamp } from "@blobscan/eth-price";

import { BaseSyncer } from "../BaseSyncer";
import type { BaseSyncerConfig } from "../BaseSyncer";

const ETH_UDC_CONTRACT = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const ONE_HOUR_SECONDS = BigInt(60 * 60);

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: Omit<BaseSyncerConfig, "syncerFn" | "name">) {
    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const priceData = await getPriceByTimestamp({
          address: ETH_UDC_CONTRACT,
          targetTimestamp: BigInt(Math.floor(Date.now() / 1_000)),
          tolerance: ONE_HOUR_SECONDS,
        });

        // The timestamp is a bigint in seconds.
        // Prisma expects a Date object.
        const timestamp = new Date(Number(priceData.timestamp) * 1_000);

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
