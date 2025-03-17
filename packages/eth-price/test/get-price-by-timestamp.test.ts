import { expect, describe, it } from "vitest";

import { getPriceByTimestamp } from "../src/get-price-by-timestamp";

const contractAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const contractUpdatePeriod = BigInt(60 * 60); // 1 hour
const nowSeconds = BigInt(Math.floor(Number(new Date()) / 1000));

describe("getPriceByTimestamp", () => {
  it("should return the price for a given timestamp", async () => {
    const response = await getPriceByTimestamp({
      address: contractAddress,
      tolerance: contractUpdatePeriod,
      targetTimestampSeconds: nowSeconds,
    });

    expect(response.timestampSeconds - nowSeconds).toBeLessThan(
      contractUpdatePeriod
    );
  });

  it("the difference between the timestamp and the response timestamp should be less than the contract update period", async () => {
    for (let i = 0; i < 10; i++) {
      const targetTimestampSeconds =
        nowSeconds - BigInt(i) * contractUpdatePeriod;

      const response = await getPriceByTimestamp({
        address: contractAddress,
        targetTimestampSeconds,
        tolerance: contractUpdatePeriod,
      });

      expect(response.timestampSeconds - targetTimestampSeconds).toBeLessThan(
        contractUpdatePeriod
      );
    }
  });

  it("[fuzzing] 10 random timestamps", async () => {
    const oneYearSeconds = 60 * 60 * 24 * 365;
    const oneYearAgo = nowSeconds - BigInt(oneYearSeconds);

    for (let i = 0; i < 10; i++) {
      const targetTimestampSeconds =
        oneYearAgo + BigInt(Math.floor(Math.random() * oneYearSeconds));

      const response = await getPriceByTimestamp({
        address: contractAddress,
        targetTimestampSeconds,
        tolerance: contractUpdatePeriod,
      });

      const difference = response.timestampSeconds - targetTimestampSeconds;
      if (difference >= contractUpdatePeriod) {
        throw new Error(`
The difference between the timestamp and the response timestamp is greater than the contract update period: ${difference}
Timestamp: ${targetTimestampSeconds}
Data: ${JSON.stringify(
          {
            phaseId: response.phaseId,
            roundId: response.roundId.toString(),
            price: response.price.toString(),
            timestamp: response.timestampSeconds.toString(),
          },
          null,
          2
        )}`);
      }
    }
  });
});
