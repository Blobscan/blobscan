import dayjs, { normalizeDate } from "@blobscan/dayjs";
import type { BlobscanPrismaClient } from "@blobscan/db";
import { getMaxStaleness, PriceFeed } from "@blobscan/price-feed";
import type { PriceData, PriceFeedDefinition } from "@blobscan/price-feed";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";
import { SyncerError } from "../errors";

type PriceFeedClient = Parameters<typeof PriceFeed.create>[0]["client"];

export interface EthUsdPriceFeedSource {
  definition: PriceFeedDefinition;
  client: PriceFeedClient;
}

export interface ETHPriceSyncerConfig extends CommonSyncerConfig {
  prisma: BlobscanPrismaClient;
  /**
   * The feeds to read, in priority order. The syncer uses the first feed that
   * returns a price.
   */
  priceFeedSources: EthUsdPriceFeedSource[];
  /**
   * The maximum age in seconds of a round. When it is not set, each feed uses
   * its own maximum staleness.
   */
  timeTolerance?: number;
}

type Granularity = "minute" | "hour" | "day";

type LoadedPriceFeed = {
  feed: PriceFeed;
  priceFeedId: number;
};

type PriceFeedSourceState = EthUsdPriceFeedSource & {
  loaded?: LoadedPriceFeed;
};

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

function describeSource({ definition }: EthUsdPriceFeedSource) {
  return `${definition.chain.name} (chain ${definition.chain.id}, feed ${definition.address})`;
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return "shortMessage" in err && typeof err.shortMessage === "string"
      ? err.shortMessage
      : err.message;
  }

  return String(err);
}

/**
 * Creates the feed at its first use, and records it in the `price_feed`
 * table. If this fails, the next tick tries again.
 */
async function loadPriceFeed(
  source: PriceFeedSourceState,
  prisma: BlobscanPrismaClient,
  timeTolerance: number | undefined
): Promise<LoadedPriceFeed> {
  if (source.loaded) {
    return source.loaded;
  }

  const { definition, client } = source;
  const feed = await PriceFeed.create({
    client,
    dataFeedContractAddress: definition.address,
    timeTolerance: timeTolerance ?? getMaxStaleness(definition),
  });

  const { id } = await prisma.priceFeed.upsert({
    create: {
      chainId: definition.chain.id,
      address: definition.address,
      description: feed.description,
      decimals: feed.priceDecimals,
    },
    update: {},
    where: {
      chainId_address: {
        chainId: definition.chain.id,
        address: definition.address,
      },
    },
  });

  source.loaded = { feed, priceFeedId: id };

  return source.loaded;
}

export class ETHPriceSyncer extends BaseSyncer {
  constructor(config: ETHPriceSyncerConfig) {
    if (!config.priceFeedSources.length) {
      throw new Error(
        "Can't create the ETH price syncer: no price feed sources were given"
      );
    }

    const sources: PriceFeedSourceState[] = config.priceFeedSources.map(
      (source) => ({ ...source })
    );

    super({
      ...config,
      name: "eth-price",
      syncerFn: async () => {
        const now = normalizeDate(dayjs());
        const granularity = determineGranularity(config.cronPattern);
        const targetDateTime = now.startOf(granularity);
        const targetIso = targetDateTime.utc().toISOString();

        const failures: string[] = [];
        let result:
          | { source: PriceFeedSourceState; priceFeedId: number; data: PriceData }
          | undefined;

        for (const source of sources) {
          try {
            const { feed, priceFeedId } = await loadPriceFeed(
              source,
              config.prisma,
              config.timeTolerance
            );
            const data = await feed.findPriceByTimestamp(targetDateTime.unix());

            if (data) {
              result = { source, priceFeedId, data };

              break;
            }

            failures.push(`${describeSource(source)}: no round in tolerance`);
            this.logger.warn(
              `No ETH price in tolerance for ${targetIso} from ${describeSource(
                source
              )}. Trying the next feed.`
            );
          } catch (err) {
            failures.push(`${describeSource(source)}: ${getErrorMessage(err)}`);
            this.logger.warn(
              `Failed to read the ETH price for ${targetIso} from ${describeSource(
                source
              )}: ${getErrorMessage(err)}. Trying the next feed.`
            );
          }
        }

        if (!result) {
          throw new SyncerError(
            this.name,
            `No ETH price found for ${targetIso} in any price feed`,
            new Error(failures.join("; "))
          );
        }

        const { source, priceFeedId, data } = result;
        const priceTimestamp = targetDateTime.toDate();
        const priceRow = {
          price: data.price,
          timestamp: priceTimestamp,
          roundId: data.roundId.toString(),
          roundTimestamp: data.timestamp,
          priceFeedId,
        };

        await config.prisma.ethUsdPrice.upsert({
          create: priceRow,
          update: priceRow,
          where: {
            timestamp: priceTimestamp,
          },
        });

        this.logger.debug(
          `ETH price synced: $${
            data.price
          } at ${targetIso} (round ${data.roundId.toString()} from ${describeSource(
            source
          )})`
        );
      },
    });
  }
}
