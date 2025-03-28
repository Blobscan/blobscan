import { createPublicClient, formatUnits, http } from "viem";
import type { PublicClient } from "viem";
import { mainnet, foundry } from "viem/chains";
import { expect, describe, it, beforeAll } from "vitest";

import { testValidError } from "@blobscan/test";

import { PriceFeed } from "../src/PriceFeed";
import { EACAggregatorProxyABI } from "../src/abi/EACAggregatorProxy";

const DATE_FEED_CONTRACT_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

describe("PriceFeedFinder", () => {
  let client: PublicClient;
  let priceFeed: PriceFeed;

  // 23-05-2023T11:25:45 UTC
  const timestamp = 1684841145;
  const expectedRoundId = BigInt("110680464442257311436");

  beforeAll(async () => {
    client = createPublicClient({
      chain: {
        ...foundry,
        contracts: {
          multicall3: mainnet.contracts.multicall3,
        },
      },
      transport: http(),
    });

    priceFeed = await PriceFeed.create({
      client,
      dataFeedContractAddress: DATE_FEED_CONTRACT_ADDRESS,
    });
  });

  describe("when fetching a price by a given timestamp", () => {
    it("should retrieve the correct price data", async () => {
      const [_, expectedPrice, __, expectedUpdatedAt] =
        await client.readContract({
          address: DATE_FEED_CONTRACT_ADDRESS,
          abi: EACAggregatorProxyABI,
          functionName: "getRoundData",
          args: [expectedRoundId],
        });

      const { price, timestamp: priceTimestamp } =
        (await priceFeed.findPriceByTimestamp(timestamp)) || {};

      expect(price, "Price mismatch").toBe(
        Number(formatUnits(expectedPrice, priceFeed.priceDecimals))
      );
      expect(
        (priceTimestamp?.getTime() ?? 0) / 1000,
        "Price timestamp mismatch"
      ).toBe(Number(expectedUpdatedAt));
    });

    it("should retrieve the correct price data when a tolerance threshold is set", async () => {
      const priceFeedWithTolerance = await PriceFeed.create({
        client,
        dataFeedContractAddress: DATE_FEED_CONTRACT_ADDRESS,
        timeTolerance: 60,
      });

      const priceData = await priceFeedWithTolerance.findPriceByTimestamp(
        timestamp
      );

      expect(priceData).toBeNull();
    });

    it("should return no price data when the timestamp is in the future", async () => {
      const futureTimestamp = new Date("2057-01-24T00:00:00").getTime() / 1000;

      const priceData = await priceFeed.findPriceByTimestamp(futureTimestamp);

      expect(priceData).toBeNull();
    });
  });

  describe("when creating a new instance", () => {
    testValidError(
      "should fail when providing an invalid data feed contract address",
      async () => {
        await PriceFeed.create({
          client,
          dataFeedContractAddress: "0x254CF413F17DB09EBdA443be26c6cCEbaC436D48",
        });
      },
      Error,
      { checkCause: true }
    );
  });
});
