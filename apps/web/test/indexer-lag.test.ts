import { afterEach, describe, expect, it, vi } from "vitest";

import { chains } from "@blobscan/chains";

import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "~/utils/date";
import { formatIndexerLag, getIndexerLag } from "~/utils/indexer-lag";

const { mainnet } = chains;

describe("when getting the indexer lag", () => {
  const { activationSlot, activationDate } = mainnet.latestFork;
  const anchorMs = activationDate.getTime();

  it("should return undefined when there is no chain", () => {
    expect(
      getIndexerLag({
        lastUpperSyncedSlot: activationSlot,
        measuredAt: anchorMs,
      })
    ).toBeUndefined();
  });

  it("should return undefined when there is no last synced slot", () => {
    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: null,
        measuredAt: anchorMs,
      })
    ).toBeUndefined();
  });

  it("should not be out of sync when the lag is below the threshold", () => {
    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot,
        measuredAt: anchorMs + 4 * MS_PER_MINUTE,
      })
    ).toEqual({ lagMs: 4 * MS_PER_MINUTE, isOutOfSync: false });
  });

  it("should be out of sync when the lag is above the threshold", () => {
    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot + 10,
        measuredAt: anchorMs + 10 * MS_PER_MINUTE,
      })
    ).toEqual({ lagMs: 10 * MS_PER_MINUTE - 10 * 12_000, isOutOfSync: true });
  });

  it("should not return a negative lag when the slot is ahead of the clock", () => {
    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot + 100,
        measuredAt: anchorMs,
      })
    ).toEqual({ lagMs: 0, isOutOfSync: false });
  });

  describe("when the current time is much later than the fetch time", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should measure the lag at the fetch time", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      // For example, a tab that was in the background for an hour.
      vi.setSystemTime(anchorMs + MS_PER_HOUR);

      expect(
        getIndexerLag({
          chain: mainnet,
          lastUpperSyncedSlot: activationSlot,
          measuredAt: anchorMs + MS_PER_MINUTE,
        })
      ).toEqual({ lagMs: MS_PER_MINUTE, isOutOfSync: false });
    });
  });
});

describe("when formatting the indexer lag", () => {
  it.each([
    [30_000, "1 minute"],
    [25 * MS_PER_MINUTE, "25 minutes"],
    [MS_PER_HOUR, "1 hour"],
    [5 * MS_PER_HOUR, "5 hours"],
    [MS_PER_DAY, "1 day"],
    [3 * MS_PER_DAY, "3 days"],
  ])("should format %d ms as %s", (lagMs, expected) => {
    expect(formatIndexerLag(lagMs)).toBe(expected);
  });
});
