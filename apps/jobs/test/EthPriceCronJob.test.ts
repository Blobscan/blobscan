import { afterEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";
import { fixtures, getViemClient } from "@blobscan/test";

import workerProcessor from "../src/cron-jobs/eth-price/processor";
import type { EthPriceJob } from "../src/cron-jobs/eth-price/types";
import { env } from "../src/env";

vi.mock("../src/cron-jobs/eth-price/viem.ts", async () => {
  return {
    client: getViemClient(),
  };
});

describe("EthPriceCronJob", () => {
  const job = {
    data: {
      granularity: "minute",
    },
  } as EthPriceJob;

  afterEach(() => {
    vi.setSystemTime(fixtures.systemDate);
    vi.resetAllMocks();
  });

  it("should sync eth price for current timestamp", async () => {
    vi.setSystemTime("2023-08-31T11:56:30");
    await workerProcessor(job);

    const expectedTimestamp = dayjs().utc().startOf("minute");

    const ethPrices = await prisma.ethUsdPrice.findMany();
    const ethPrice = ethPrices[0];

    expect(ethPrice?.timestamp.toISOString()).toEqual(
      expectedTimestamp.toISOString()
    );
  });

  describe("when time tolerance is set", () => {
    it("should sync eth price if it is within threshold", async () => {
      vi.setSystemTime("2023-08-31T11:56:30");

      await workerProcessor(job);

      const latestPrice = await prisma.ethUsdPrice.findFirst({
        orderBy: {
          timestamp: "desc",
        },
      });

      const timestamp = dayjs.unix(Number(latestPrice?.timestamp));

      expect(dayjs().diff(timestamp, "second")).toBeLessThanOrEqual(
        env.ETH_PRICE_SYNCER_TIME_TOLERANCE as number
      );
    });

    it("should skip eth price if it is outside threshold", async () => {
      await workerProcessor(job);

      const ethPrices = await prisma.ethUsdPrice.findMany();

      expect(ethPrices).toHaveLength(0);
    });
  });
});
