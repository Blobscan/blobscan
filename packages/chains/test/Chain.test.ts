import { describe, expect, it, test } from "vitest";

import { testValidError } from "@blobscan/test";

import { Chain } from "../src/Chain";
import { gnosis, mainnet } from "../src/chains";
import * as forks from "../src/forks";
import type { Fork } from "../src/types";

describe("Chain", () => {
  const chain = mainnet;

  it("should get a fork", async () => {
    const fork = chain.getFork("dencun");
    const expectedFork: Fork = {
      forkName: "dencun",
      activationSlot: 8_626_176,
      activationDate: new Date("2024-03-13T13:55:00Z"),
      blobParams: forks.dencun,
    };

    expect(fork).toEqual(expectedFork);
  });

  it("should get latest fork", () => {
    let expectedLatestFork = chain.forks[0];

    chain.forks.forEach((f) => {
      if (f.activationSlot >= expectedLatestFork.activationSlot) {
        expectedLatestFork = f;
      }
    });

    expect(chain.latestFork).toEqual(expectedLatestFork);
  });

  describe("when getting active fork given a slot", () => {
    test.each(chain.forks.map((f) => [f.forkName, f]))(
      "should get %s fork",
      (_, expectedFork) => {
        const activeFork = chain.getActiveForkBySlot(
          expectedFork.activationSlot
        );

        expect(activeFork).toEqual(expectedFork);
      }
    );
  });

  describe("when getting active fork given a date", () => {
    test.each(chain.forks.map((f) => [f.forkName, f]))(
      "should get %s fork",
      (_, expectedFork) => {
        const afterForkMs = expectedFork.activationDate.getTime() + 1000;

        const activeForkByDate = chain.getActiveForkByDate(
          new Date(afterForkMs)
        );
        const activeForkByTimestamp = chain.getActiveForkByDate(afterForkMs);

        expect(activeForkByDate, "active fork by date mismatch").toEqual(
          expectedFork
        );
        expect(
          activeForkByTimestamp,
          "active fork by timestamp mismatch"
        ).toEqual(expectedFork);
      }
    );
  });

  describe("slotsPerEpoch", () => {
    it("should default to 32 slots per epoch", () => {
      expect(mainnet.slotsPerEpoch).toBe(32);
    });

    it("should use the provided slotsPerEpoch value", () => {
      expect(gnosis.slotsPerEpoch).toBe(16);
    });

    it("should accept a custom slotsPerEpoch in the constructor", () => {
      const customChain = new Chain(
        999,
        "custom",
        { number: 0 },
        {
          dencun: {
            activationDate: new Date("2024-01-01T00:00:00Z"),
            activationSlot: 0,
          },
        },
        8
      );

      expect(customChain.slotsPerEpoch).toBe(8);
    });
  });

  testValidError(
    "should throw an error when instantiating a chain without providing any forks",
    () => {
      new Chain(11, "test", { number: 0 }, {});
    },
    Error
  );
});
