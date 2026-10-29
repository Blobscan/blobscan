import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { getPrisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { PriceFeed } from "@blobscan/price-feed";
import { fixtures, getViemClient } from "@blobscan/test";

import { EthPriceJob } from "../src/jobs";
import type { EthPriceJobConfig } from "../src/jobs";

const prisma = getPrisma();

class EthPriceJobMock extends EthPriceJob {
  constructor({ ethUsdPriceFeed }: Pick<EthPriceJobConfig, "ethUsdPriceFeed">) {
    super({
      prisma,
      cronPattern: env.ETH_PRICE_JOB_CRON_PATTERN,
      ethUsdPriceFeed,
    });
  }

  getJobFn() {
    return this.jobFn;
  }
}

describe("EthPriceJob", () => {
  let ethPriceJob: EthPriceJobMock;

  beforeEach(async () => {
    const ethUsdPriceFeed = await PriceFeed.create({
      client: getViemClient(),
      dataFeedContractAddress:
        env.ETH_PRICE_JOB_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
    });
    ethPriceJob = new EthPriceJobMock({ ethUsdPriceFeed });

    return async () => {
      await ethPriceJob.stop();
    };
  });

  afterEach(() => {
    vi.setSystemTime(fixtures.systemDate);
  });

  it("should sync eth price for current timestamp", async () => {
    const jobFn = ethPriceJob.getJobFn();

    await jobFn();

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
          env.ETH_PRICE_JOB_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
        timeTolerance,
      });

      const ethPriceJobWithTimeTolerance = new EthPriceJobMock({
        ethUsdPriceFeed,
      });

      const jobFn = ethPriceJobWithTimeTolerance.getJobFn();

      await jobFn();

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
          env.ETH_PRICE_JOB_ETH_USD_PRICE_FEED_CONTRACT_ADDRESS! as `0x${string}`,
        timeTolerance,
      });
      const ethPriceJobWithTimeTolerance = new EthPriceJobMock({
        ethUsdPriceFeed,
      });

      const jobFn = ethPriceJobWithTimeTolerance.getJobFn();
      await jobFn();

      const ethPrices = await prisma.ethUsdPrice.findMany();

      expect(ethPrices).toHaveLength(0);
    });
  });
});
