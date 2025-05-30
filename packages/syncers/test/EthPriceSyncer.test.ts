/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { PriceFeed } from "@blobscan/price-feed";
import { fixtures, getViemClient } from "@blobscan/test";

import { env } from "../../env";
import { ETHPriceSyncer } from "../src";
import type { ETHPriceSyncerConfig } from "../src/syncers/ETHPriceSyncer";

class EthPriceUpdaterMock extends ETHPriceSyncer {
  constructor({
    ethUsdPriceFeed,
  }: Pick<ETHPriceSyncerConfig, "ethUsdPriceFeed">) {
    super({
      cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
      redisUriOrConnection: env.REDIS_URI,
      ethUsdPriceFeed,
    });
  }

  getWorker() {
    return this.worker;
  }

  getWorkerProcessor() {
    return this.syncerFn;
  }

  getQueue() {
    return this.queue;
  }
}

describe("EthPriceSyncer", () => {
  let ethPriceUpdater: EthPriceUpdaterMock;

  beforeEach(async () => {
    const ethUsdPriceFeed = await PriceFeed.create({
      client: getViemClient(),
      dataFeedContractAddress:
        env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
    });
    ethPriceUpdater = new EthPriceUpdaterMock({ ethUsdPriceFeed });

    return async () => {
      await ethPriceUpdater.close();
    };
  });

  afterEach(() => {
    vi.setSystemTime(fixtures.systemDate);
  });

  it("should sync eth price for current timestamp", async () => {
    const workerProcessor = ethPriceUpdater.getWorkerProcessor();

    await workerProcessor();

    const expectedTimestamp = dayjs().utc().startOf("minute");

    const ethPrices = await prisma.ethUsdPrice.findMany();
    const ethPrice = ethPrices[0];

    expect(ethPrice?.timestamp.toISOString()).toEqual(
      expectedTimestamp.toISOString()
    );
  });

  describe("when time tolerance is set", () => {
    it("should sync eth price if it is within threshold", async () => {
      const timeTolerance = 3600;
      const ethUsdPriceFeed = await PriceFeed.create({
        client: getViemClient(),
        dataFeedContractAddress:
          env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
        timeTolerance,
      });

      const ethPriceUpdaterWithTimeTolerance = new EthPriceUpdaterMock({
        ethUsdPriceFeed,
      });

      const workerProcessor =
        ethPriceUpdaterWithTimeTolerance.getWorkerProcessor();

      await workerProcessor();

      const latestPrice = await prisma.ethUsdPrice.findFirst({
        orderBy: {
          timestamp: "desc",
        },
      });

      const timestamp = dayjs.unix(Number(latestPrice?.timestamp));

      expect(dayjs().diff(timestamp, "second")).toBeLessThanOrEqual(
        timeTolerance
      );
    });

    it("should skip eth price if it is outside threshold", async () => {
      const timeTolerance = 60;

      const ethUsdPriceFeed = await PriceFeed.create({
        client: getViemClient(),
        dataFeedContractAddress:
          env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
        timeTolerance,
      });
      const ethPriceUpdaterWithTimeTolerance = new EthPriceUpdaterMock({
        ethUsdPriceFeed,
      });

      const workerProcessor =
        ethPriceUpdaterWithTimeTolerance.getWorkerProcessor();
      await workerProcessor();

      const ethPrices = await prisma.ethUsdPrice.findMany();

      expect(ethPrices).toHaveLength(0);
    });
  });
});
