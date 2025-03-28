/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { env } from "../../env";
import { ETHPriceSyncer } from "../src";
import type { ETHPriceSyncerConfig } from "../src/syncers/ETHPriceSyncer";

class EthPriceUpdaterMock extends ETHPriceSyncer {
  constructor(config: Partial<ETHPriceSyncerConfig> = {}) {
    super({
      cronPattern: env.ETH_PRICE_SYNCER_CRON_PATTERN,
      redisUriOrConnection: "redis://localhost:6379/1",
      ...config,
      // Zod is not properly coercing the chainId to a number
      chainId: Number(env.ETH_PRICE_SYNCER_CHAIN_ID)!,
      chainJsonRpcUrl: env.ETH_PRICE_SYNCER_CHAIN_JSON_RPC_URL!,
      ethUsdDataFeedContractAddress:
        env.ETH_PRICE_SYNCER_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS!,
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

  beforeEach(() => {
    ethPriceUpdater = new EthPriceUpdaterMock();

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
});
