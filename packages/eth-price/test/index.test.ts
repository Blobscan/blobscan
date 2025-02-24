import { expect, describe, it } from "vitest";

import { getPriceByTimestamp } from "../src/get-price-by-timestamp";

const contractAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const contractUpdatePeriod = BigInt(60 * 60); // 1 hour
const nowSeconds = BigInt(Math.floor(Number(new Date()) / 1000));

describe("getPriceByTimestamp", () => {
  it("should return the price for a given timestamp", async () => {
    const response = await getPriceByTimestamp({
      address: contractAddress,
      targetTimestamp: nowSeconds,
      tolerance: contractUpdatePeriod,
    });

    expect(response.timestamp - nowSeconds).toBeLessThan(contractUpdatePeriod);
  });

  it("the difference between the timestamp and the response timestamp should be less than the contract update period", async () => {
    for (let i = 0; i < 10; i++) {
      const targetTimestamp = nowSeconds - BigInt(i) * contractUpdatePeriod;

      const response = await getPriceByTimestamp({
        address: contractAddress,
        targetTimestamp,
        tolerance: contractUpdatePeriod,
      });

      expect(response.timestamp - targetTimestamp).toBeLessThan(
        contractUpdatePeriod
      );
    }
  });

  it("[fuzzing] 10 random timestamps", async () => {
    const oneYearSeconds = 60 * 60 * 24 * 365;
    const oneYearAgo = nowSeconds - BigInt(oneYearSeconds);

    for (let i = 0; i < 10; i++) {
      const targetTimestamp =
        oneYearAgo + BigInt(Math.floor(Math.random() * oneYearSeconds));

      const response = await getPriceByTimestamp({
        address: contractAddress,
        targetTimestamp,
        tolerance: contractUpdatePeriod,
      });

      const difference = response.timestamp - targetTimestamp;
      if (difference >= contractUpdatePeriod) {
        throw new Error(`
The difference between the timestamp and the response timestamp is greater than the contract update period: ${difference}
Timestamp: ${targetTimestamp}
Data: ${JSON.stringify(
          {
            phaseId: response.phaseId,
            roundId: response.roundId.toString(),
            price: response.price.toString(),
            timestamp: response.timestamp.toString(),
          },
          null,
          2
        )}`);
      }
    }
  });
});
