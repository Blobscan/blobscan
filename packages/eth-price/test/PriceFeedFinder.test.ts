import "./polyfill";
import { createServer } from "prool";
import { anvil } from "prool/instances";
import { createPublicClient, http } from "viem";
import { foundry } from "viem/chains";
import { expect, describe, it, beforeAll } from "vitest";

import { PriceData, PriceFeedFinder } from "../src/PriceFeedFinder";

const contractAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const tolerance = BigInt(60 * 60); // 1 hour

describe("PriceFeedFinder", () => {
  let priceFeedFinder: PriceFeedFinder;

  // 24-01-2025T17:25:12
  const timestampSeconds = 1737739512n;

  beforeAll(async () => {
    const instance = anvil({
      forkChainId: 1,
      forkUrl:
        process.env.VITEST_MAINNET_FORK_URL ?? "https://eth.llamarpc.com",
      forkBlockNumber: 22118050,
      port: 8545,
    });

    await instance.start();

    const server = createServer({
      instance,
    });
    await server.start();
    const client = createPublicClient({
      chain: {
        ...foundry,
        contracts: {
          multicall3: {
            address: "0xca11bde05977b3631167028862be2a173976ca11",
            blockCreated: 14_353_601,
          },
        },
      },
      transport: http(),
    });
    priceFeedFinder = new PriceFeedFinder(client, contractAddress, tolerance);

    return async () => {
      await instance.stop();
      await server.stop();
    };
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
