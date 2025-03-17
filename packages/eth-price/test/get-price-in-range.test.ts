import { expect, describe, it } from "vitest";

import { getPriceInRange } from "../src/get-price-in-range";

const CONTRACT_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const CONTRACT_UPDATE_PERIOD = BigInt(60 * 60);

const END_TIMESTAMP = 1742178000n;
const START_TIMESTAMP = END_TIMESTAMP - BigInt(5) * CONTRACT_UPDATE_PERIOD;

// This data was compared with the data provided by Chainlink on this page:
// https://data.chain.link/feeds/ethereum/mainnet/eth-usd
const EXPECTED_PRICE_DATA = [
  { price: 189141782500n, timestamp: 1742161583n },
  { price: 187956000000n, timestamp: 1742162927n },
  { price: 187212727300n, timestamp: 1742166527n },
  { price: 188187282561n, timestamp: 1742166983n },
  { price: 189184075000n, timestamp: 1742170079n },
  { price: 190244819316n, timestamp: 1742172419n },
  { price: 190746000000n, timestamp: 1742176043n },
  { price: 190847223672n, timestamp: 1742179679n },
];

describe("getPriceInRange", () => {
  it("should return all price data in the given range", async () => {
    const prices = await getPriceInRange({
      address: CONTRACT_ADDRESS,
      startTimestampSeconds: START_TIMESTAMP,
      endTimestampSeconds: END_TIMESTAMP,
      contractUpdatePeriodSeconds: CONTRACT_UPDATE_PERIOD,
    });

    for (let i = 0; i < prices.length; i++) {
      expect(prices[i].price).toBe(EXPECTED_PRICE_DATA[i].price);
      expect(prices[i].timestamp).toBe(EXPECTED_PRICE_DATA[i].timestamp);
    }
  });
});
