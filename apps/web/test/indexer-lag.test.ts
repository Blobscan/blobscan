import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { chains } from "@blobscan/chains";

import { formatIndexerLag, getIndexerLag } from "~/utils/indexer-lag";

const MINUTE = 60_000;
const { mainnet } = chains;

describe("getIndexerLag", () => {
  const { activationSlot, activationDate } = mainnet.latestFork;
  const anchorMs = activationDate.getTime();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return undefined when there is no chain", () => {
    expect(
      getIndexerLag({
        lastUpperSyncedSlot: activationSlot,
        thresholdMinutes: 5,
      })
    ).toBeUndefined();
  });

  it("should return undefined when there is no last synced slot", () => {
    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: null,
        thresholdMinutes: 5,
      })
    ).toBeUndefined();
  });

  it("should not be out of sync when the lag is below the threshold", () => {
    vi.setSystemTime(anchorMs + 4 * MINUTE);

    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot,
        thresholdMinutes: 5,
      })
    ).toEqual({ lagMs: 4 * MINUTE, isOutOfSync: false });
  });

  it("should be out of sync when the lag is above the threshold", () => {
    vi.setSystemTime(anchorMs + 10 * MINUTE);

    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot + 10,
        thresholdMinutes: 5,
      })
    ).toEqual({ lagMs: 10 * MINUTE - 10 * 12_000, isOutOfSync: true });
  });

  it("should not return a negative lag when the slot is ahead of the clock", () => {
    vi.setSystemTime(anchorMs);

    expect(
      getIndexerLag({
        chain: mainnet,
        lastUpperSyncedSlot: activationSlot + 100,
        thresholdMinutes: 5,
      })
    ).toEqual({ lagMs: 0, isOutOfSync: false });
  });
});

describe("formatIndexerLag", () => {
  it.each([
    [30_000, "1 minute"],
    [25 * MINUTE, "25 minutes"],
    [60 * MINUTE, "1 hour"],
    [5 * 60 * MINUTE, "5 hours"],
    [24 * 60 * MINUTE, "1 day"],
    [3 * 24 * 60 * MINUTE, "3 days"],
  ])("should format %d ms as %s", (lagMs, expected) => {
    expect(formatIndexerLag(lagMs)).toBe(expected);
  });
});
