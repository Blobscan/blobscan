import { createPublicClient, http } from "viem";
import { mainnet, polygon } from "viem/chains";
import { afterEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { getPrisma } from "@blobscan/db";
import { findEthUsdPriceFeed, PriceFeed } from "@blobscan/price-feed";
import type { PriceFeedDefinition } from "@blobscan/price-feed";
import { fixtures, getViemClient } from "@blobscan/test";

import { env } from "../../env";
import { ETHPriceSyncer } from "../src";
import type {
  ETHPriceSyncerConfig,
  EthUsdPriceFeedSource,
} from "../src/syncers/ETHPriceSyncer";

const prisma = getPrisma();

// The tests run against an Anvil fork of Ethereum mainnet.
const MAINNET_FEED = findEthUsdPriceFeed(mainnet.id)!;

class EthPriceSyncerMock extends ETHPriceSyncer {
  constructor(
    config: Pick<ETHPriceSyncerConfig, "priceFeedSources" | "timeTolerance">
  ) {
    super({
      prisma,
      cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
      redisUriOrConnection: env.REDIS_URI,
      ...config,
    });
  }

  getWorkerProcessor() {
    return this.syncerFn;
  }

  getLogger() {
    return this.logger;
  }
}

function anvilSource(
  definition: Partial<PriceFeedDefinition> = {}
): EthUsdPriceFeedSource {
  return {
    definition: { ...MAINNET_FEED, ...definition },
    client: getViemClient(),
  };
}

/**
 * A source whose RPC is not reachable. It uses a different chain, so that it
 * gets its own `price_feed` row.
 */
function unreachableSource(): EthUsdPriceFeedSource {
  return {
    definition: findEthUsdPriceFeed(polygon.id)!,
    client: createPublicClient({
      chain: polygon,
      transport: http("http://127.0.0.1:1", { retryCount: 0 }),
    }),
  };
}

describe("EthPriceSyncer", () => {
  const syncers: EthPriceSyncerMock[] = [];

  function createSyncer(
    config: Pick<ETHPriceSyncerConfig, "priceFeedSources" | "timeTolerance">
  ) {
    const syncer = new EthPriceSyncerMock(config);

    syncers.push(syncer);

    return syncer;
  }

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(syncers.splice(0).map((syncer) => syncer.close()));

    vi.setSystemTime(fixtures.systemDate);
  });

  it("should sync the eth price for the current timestamp", async () => {
    const syncer = createSyncer({ priceFeedSources: [anvilSource()] });

    await syncer.getWorkerProcessor()();

    const expectedTimestamp = dayjs().utc().startOf("hour");
    const ethPrices = await prisma.ethUsdPrice.findMany();

    expect(ethPrices).toHaveLength(1);
    expect(ethPrices[0]?.timestamp.toISOString()).toEqual(
      expectedTimestamp.toISOString()
    );
  });

  it("should store the audit data of the price", async () => {
    const syncer = createSyncer({ priceFeedSources: [anvilSource()] });

    await syncer.getWorkerProcessor()();

    const ethPrice = await prisma.ethUsdPrice.findFirstOrThrow({
      include: { priceFeed: true },
    });

    expect(ethPrice.roundId?.toString()).toMatch(/^\d+$/);
    expect(ethPrice.roundTimestamp).toBeInstanceOf(Date);
    expect(ethPrice.roundTimestamp!.getTime()).toBeLessThanOrEqual(
      ethPrice.timestamp.getTime()
    );
    expect(ethPrice.createdAt).toBeInstanceOf(Date);
    expect(ethPrice.updatedAt).toBeInstanceOf(Date);
    expect(ethPrice.priceFeed).toMatchObject({
      chainId: mainnet.id,
      address: MAINNET_FEED.address,
      description: "ETH / USD",
      decimals: 8,
    });
  });

  it("should create the price feed row only one time", async () => {
    const syncer = createSyncer({ priceFeedSources: [anvilSource()] });

    await syncer.getWorkerProcessor()();
    await syncer.getWorkerProcessor()();

    await expect(prisma.priceFeed.count()).resolves.toBe(1);
  });

  it("should create each price feed one time when it returns prices", async () => {
    const createSpy = vi.spyOn(PriceFeed, "create");
    const syncer = createSyncer({ priceFeedSources: [anvilSource()] });

    await syncer.getWorkerProcessor()();
    await syncer.getWorkerProcessor()();

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  describe("when a price feed has no round in tolerance", () => {
    it("should create the price feed again on the next tick", async () => {
      const createSpy = vi.spyOn(PriceFeed, "create");
      const syncer = createSyncer({
        priceFeedSources: [anvilSource()],
        timeTolerance: 60,
      });

      await expect(syncer.getWorkerProcessor()()).rejects.toThrow();
      await expect(syncer.getWorkerProcessor()()).rejects.toThrow();

      expect(createSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the first price feed fails", () => {
    it("should use the next feed when the RPC is not reachable", async () => {
      const syncer = createSyncer({
        priceFeedSources: [unreachableSource(), anvilSource()],
      });

      await syncer.getWorkerProcessor()();

      const ethPrice = await prisma.ethUsdPrice.findFirstOrThrow({
        include: { priceFeed: true },
      });

      expect(ethPrice.priceFeed?.chainId).toBe(mainnet.id);
    });

    it("should log the cause of the RPC error", async () => {
      const syncer = createSyncer({
        priceFeedSources: [unreachableSource(), anvilSource()],
      });
      const warnSpy = vi.spyOn(syncer.getLogger(), "warn");

      await syncer.getWorkerProcessor()();

      const warning = String(warnSpy.mock.calls[0]?.[0]);

      expect(warning).toContain("Polygon");
      expect(warning).toContain(
        "Failed to retrieve aggregators from data feed contract"
      );
      expect(warning).toContain("HTTP request failed");
      expect(warning).not.toContain("127.0.0.1:1");
    });

    it("should use the next feed when the round is stale", async () => {
      const staleSource = anvilSource({
        // The maximum staleness becomes 60 seconds, so the last round is too
        // old.
        heartbeat: 0,
        chain: { ...mainnet, id: 999_999 },
      });
      const syncer = createSyncer({
        priceFeedSources: [staleSource, anvilSource()],
      });

      await syncer.getWorkerProcessor()();

      const ethPrice = await prisma.ethUsdPrice.findFirstOrThrow({
        include: { priceFeed: true },
      });

      expect(ethPrice.priceFeed?.chainId).toBe(mainnet.id);
    });
  });

  describe("when all the price feeds fail", () => {
    it("should throw and not write a price", async () => {
      const syncer = createSyncer({
        priceFeedSources: [unreachableSource(), anvilSource()],
        timeTolerance: 60,
      });

      await expect(syncer.getWorkerProcessor()()).rejects.toThrow(
        /No ETH price found/
      );

      await expect(prisma.ethUsdPrice.count()).resolves.toBe(0);
    });
  });

  describe("when time tolerance is set", () => {
    it("should sync eth price if it is within threshold", async () => {
      const timeTolerance = 3600;
      const syncer = createSyncer({
        priceFeedSources: [anvilSource()],
        timeTolerance,
      });

      await syncer.getWorkerProcessor()();

      const latestPrice = await prisma.ethUsdPrice.findFirstOrThrow({
        orderBy: {
          timestamp: "desc",
        },
      });

      expect(
        dayjs(latestPrice.timestamp).diff(latestPrice.roundTimestamp, "second")
      ).toBeLessThanOrEqual(timeTolerance);
    });

    it("should use the time tolerance in place of the feed staleness", async () => {
      const syncer = createSyncer({
        priceFeedSources: [anvilSource()],
        timeTolerance: 60,
      });

      await expect(syncer.getWorkerProcessor()()).rejects.toThrow();

      await expect(prisma.ethUsdPrice.count()).resolves.toBe(0);
    });
  });

  it("should not accept an empty list of price feeds", () => {
    expect(() => createSyncer({ priceFeedSources: [] })).toThrow(
      /no price feed sources/
    );
  });
});
