import { createPublicClient, custom, formatUnits, http } from "viem";
import type { PublicClient } from "viem";
import { mainnet, foundry } from "viem/chains";
import { expect, describe, it, beforeAll } from "vitest";

import { testValidError } from "@blobscan/test";

import { PriceFeed } from "../src/PriceFeed";
import { EACAggregatorProxyABI } from "../src/abi/EACAggregatorProxy";
import { findEthUsdPriceFeed } from "../src/feeds";

// The tests run against an Anvil fork of Ethereum mainnet.
const DATE_FEED_CONTRACT_ADDRESS = findEthUsdPriceFeed(mainnet.id)!.address;

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

    it("should throw when the RPC fails during the search", async () => {
      let isRpcDown = false;
      const flakyClient = createPublicClient({
        chain: client.chain,
        transport: custom(
          {
            request: (args) => {
              if (isRpcDown) {
                throw new Error("RPC is down");
              }

              return client.request(args as Parameters<typeof client.request>[0]);
            },
          },
          { retryCount: 0 }
        ),
      });
      const flakyPriceFeed = await PriceFeed.create({
        client: flakyClient,
        dataFeedContractAddress: DATE_FEED_CONTRACT_ADDRESS,
      });

      isRpcDown = true;

      await expect(
        flakyPriceFeed.findPriceByTimestamp(timestamp)
      ).rejects.toThrow();
    });

    it("should return no price data when the timestamp is in the future", async () => {
      const futureTimestamp = new Date("2057-01-24T00:00:00").getTime() / 1000;

      const priceData = await priceFeed.findPriceByTimestamp(futureTimestamp);

      expect(priceData).toBeNull();
    });
  });

  describe("when the RPC fails on a round", () => {
    function createClientWithFailingCalls(error: {
      code: number;
      message: string;
    }) {
      let isFailing = false;
      const failingClient = createPublicClient({
        chain: client.chain,
        transport: custom(
          {
            request: (args) => {
              if (isFailing && args.method === "eth_call") {
                throw error;
              }

              return client.request(
                args as Parameters<typeof client.request>[0]
              );
            },
          },
          { retryCount: 0 }
        ),
      });

      return {
        failingClient,
        startFailing: () => {
          isFailing = true;
        },
      };
    }

    it("should return no price data when the provider reports a revert with code -32000", async () => {
      const { failingClient, startFailing } = createClientWithFailingCalls(
        { code: -32000, message: "execution reverted: No data present" }
      );
      const failingPriceFeed = await PriceFeed.create({
        client: failingClient,
        dataFeedContractAddress: DATE_FEED_CONTRACT_ADDRESS,
      });

      startFailing();

      await expect(
        failingPriceFeed.findPriceByRoundId(expectedRoundId)
      ).resolves.toBeNull();
    });

    it("should throw when the provider reports an error that is not a revert", async () => {
      const { failingClient, startFailing } = createClientWithFailingCalls(
        { code: -32005, message: "rate limit exceeded" }
      );
      const failingPriceFeed = await PriceFeed.create({
        client: failingClient,
        dataFeedContractAddress: DATE_FEED_CONTRACT_ADDRESS,
      });

      startFailing();

      await expect(
        failingPriceFeed.findPriceByRoundId(expectedRoundId)
      ).rejects.toThrow();
    });
  });

  describe("when creating a new instance", () => {
    it("should read the feed description and decimals", () => {
      expect(priceFeed.address).toBe(DATE_FEED_CONTRACT_ADDRESS);
      expect(priceFeed.description).toBe("ETH / USD");
      expect(priceFeed.priceDecimals).toBe(8);
    });

    it("should throw when the RPC is not reachable", async () => {
      const unreachableClient = createPublicClient({
        chain: mainnet,
        transport: http("http://127.0.0.1:1", { retryCount: 0 }),
      });

      await expect(
        PriceFeed.create({
          client: unreachableClient,
          dataFeedContractAddress: DATE_FEED_CONTRACT_ADDRESS,
        })
      ).rejects.toThrow();
    });

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
