import "./polyfill";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { expect, describe, it, beforeAll } from "vitest";

import { PriceData, PriceFeedFinder } from "../src/PriceFeedFinder";

const contractAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const tolerance = BigInt(60 * 60); // 1 hour

describe("PriceFeedFinder", () => {
  let priceFeedFinder: PriceFeedFinder;

  // 24-01-2025T17:25:12
  const timestampSeconds = 1737739512n;

  beforeAll(async () => {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(),
    });
    priceFeedFinder = new PriceFeedFinder(client, contractAddress, tolerance);
  });

  it("should return the price for a given timestamp", async () => {
    const expectedPriceData: PriceData = {
      phaseId: 7,
      roundId: 5872n,
      price: 339308999158n,
      timestampSeconds: 1737739355n,
    };
    const priceData = await priceFeedFinder.getPriceByTimestamp(
      timestampSeconds
    );
    expect(priceData.price).toBe(expectedPriceData.price);
  });
});
