import { describe, expect, it, test } from "vitest";

import { testValidError } from "@blobscan/test";

import { Chain } from "../src/Chain";
import { mainnet } from "../src/chains";
import * as forks from "../src/forks";
import type { Fork } from "../src/types";

describe("Network", () => {
  const network = mainnet;

  it("should get a fork", async () => {
    const fork = network.getFork("dencun");
    const expectedFork: Fork = {
      forkName: "dencun",
      activationSlot: 8_626_176,
      activationDate: new Date("2024-03-13T13:55:00Z"),
      blobParams: forks.dencun,
    };

    expect(fork).toEqual(expectedFork);
  });

  it("should get latest fork", () => {
    let expectedLatestFork = network.forks[0];

    network.forks.forEach((f) => {
      if (f.activationSlot >= expectedLatestFork.activationSlot) {
        expectedLatestFork = f;
      }
    });

    expect(network.latestFork).toEqual(expectedLatestFork);
  });

  describe("when getting active fork given a slot", () => {
    test.each(network.forks.map((f) => [f.forkName, f]))(
      "should get %s fork",
      (_, expectedFork) => {
        const activeFork = network.getActiveForkBySlot(
          expectedFork.activationSlot
        );

        expect(activeFork).toEqual(expectedFork);
      }
    );
  });

  describe("when getting active fork given a date", () => {
    test.each(network.forks.map((f) => [f.forkName, f]))(
      "should get %s fork",
      (_, expectedFork) => {
        const afterForkMs = expectedFork.activationDate.getTime() + 1000;

        const activeForkByDate = network.getActiveForkByDate(
          new Date(afterForkMs)
        );
        const activeForkByTimestamp = network.getActiveForkByDate(afterForkMs);

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

  testValidError(
    "should throw an error when instantiating a network without providing any forks",
    () => {
      new Chain(11, "test", { number: 0 }, {});
    },
    Error
  );
});
