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

  it("should update last synced round id after syncing eth price", async () => {
    const workerProcessor = ethPriceUpdater.getWorkerProcessor();

    await workerProcessor();

    const ethPriceFeedState = await prisma.ethUsdPriceFeedState.findFirst();

    expect(ethPriceFeedState?.latestRoundId).toMatchInlineSnapshot(
      '"110680464442257314767"'
    );
  });

  it("should backfill ETH prices for missing timestamps since last sync", async () => {
    const workerProcessor = ethPriceUpdater.getWorkerProcessor();

    await workerProcessor();

    vi.setSystemTime("2023-09-01T05:00:00Z");

    await workerProcessor();

    const ethPriceTimestamps = await prisma.ethUsdPrice.findMany({
      select: {
        price: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    expect(ethPriceTimestamps).toMatchInlineSnapshot(`
      [
        {
          "price": "1645.665",
          "timestamp": 2023-09-01T00:00:00.000Z,
        },
        {
          "price": "1652.8311",
          "timestamp": 2023-09-01T01:00:00.000Z,
        },
        {
          "price": "1650.18264211",
          "timestamp": 2023-09-01T02:00:00.000Z,
        },
        {
          "price": "1650.16453836",
          "timestamp": 2023-09-01T03:00:00.000Z,
        },
        {
          "price": "1652.12886189",
          "timestamp": 2023-09-01T04:00:00.000Z,
        },
        {
          "price": "1650.26",
          "timestamp": 2023-09-01T05:00:00.000Z,
        },
      ]
    `);
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

      const ethPriceFeedState = await prisma.ethUsdPriceFeedState.findFirst();

      const [_, __, ___, updatedAt] = await getViemClient().readContract({
        address:
          env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
        abi: [
          {
            inputs: [
              { internalType: "uint80", name: "_roundId", type: "uint80" },
            ],
            name: "getRoundData",
            outputs: [
              { internalType: "uint80", name: "roundId", type: "uint80" },
              { internalType: "int256", name: "answer", type: "int256" },
              { internalType: "uint256", name: "startedAt", type: "uint256" },
              { internalType: "uint256", name: "updatedAt", type: "uint256" },
              {
                internalType: "uint80",
                name: "answeredInRound",
                type: "uint80",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "getRoundData",
        args: [BigInt(ethPriceFeedState?.latestRoundId.toFixed() ?? 1)],
      });

      const timestamp = dayjs.unix(Number(updatedAt));

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
      const priceFeedState = await prisma.ethUsdPriceFeedState.findFirst();

      expect(ethPrices).toHaveLength(0);
      expect(priceFeedState).toBeNull();
    });
  });
});
